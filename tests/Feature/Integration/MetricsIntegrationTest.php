<?php

use App\Models\Organization;
use App\Models\Server;
use App\Models\Metric;
use App\Models\User;

describe('Metrics Integration Flow', function () {
    
    beforeEach(function () {
        $this->user = $this->actingAsUser();
        $this->organization = Organization::factory()->create([
            'owner_id' => $this->user->id,
            'api_key' => 'test-api-key-integration',
        ]);
        
        $this->server = Server::factory()->create([
            'organization_id' => $this->organization->id,
            'name' => 'integration-server',
        ]);
        
        $this->probeHeaders = [
            'Authorization' => 'Bearer test-api-key-integration',
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    });

    describe('Complete PROBE.md Workflow', function () {
        test('complete probe startup to dashboard display workflow', function () {
            // Step 1: Probe sends system information on startup
            $systemInfoData = [
                'machine_name' => 'integration-server',
                'metrics' => [
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'system_info',
                        'value' => [
                            'hostname' => 'integration-server',
                            'os' => 'Ubuntu 22.04',
                            'cpu' => [
                                'name' => 'Intel i7',
                                'cores' => 8,
                                'frequency_mhz' => 3200
                            ],
                            'ram' => [
                                'total_bytes' => 16777216000
                            ],
                            'services' => ['nginx', 'postgresql']
                        ]
                    ]
                ]
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/info",
                $systemInfoData,
                $this->probeHeaders
            );

            $response->assertStatus(200);

            // Verify system info was stored
            $this->server->refresh();
            expect($this->server->system_info)->toMatchArray($systemInfoData['metrics'][0]['value']);
            expect($this->server->status)->toBe('online');

            // Step 2: Probe sends regular metrics
            $metricsData = [
                'machine_name' => 'integration-server',
                'metrics' => [
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'cpu',
                        'value' => ['usage_percent' => 75.5]
                    ],
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'ram',
                        'value' => [
                            'total_bytes' => 16777216000,
                            'available_bytes' => 8388608000,
                            'usage_percent' => 50.0
                        ]
                    ],
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'service',
                        'metadata' => [
                            'service_name' => 'nginx',
                            'label' => 'Nginx Web Server'
                        ],
                        'value' => [
                            'status' => 'active',
                            'running' => true
                        ]
                    ]
                ]
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/metrics",
                $metricsData,
                $this->probeHeaders
            );

            $response->assertStatus(200);

            // Verify metrics were stored
            $this->assertDatabaseHas('metrics', [
                'server_id' => $this->server->id,
                'category' => 'system',
                'name' => 'cpu',
            ]);

            // Step 3: User views dashboard and sees the metrics
            $response = $this->get('/dashboard');
            $response->assertStatus(200);
            $response->assertInertia(fn ($page) =>
                $page->component('User/Dashboard')
                    ->where('stats.total_servers', 1)
                    ->where('stats.online_servers', 1)
            );

            // Step 4: User views organization dashboard
            $response = $this->get("/organizations/{$this->organization->id}");
            $response->assertStatus(200);
            $response->assertInertia(fn ($page) =>
                $page->component('User/Organizations/Dashboard')
                    ->has('servers', 1)
            );

            // Step 5: User views server details
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->server->id}");
            $response->assertStatus(200);
            $response->assertInertia(fn ($page) =>
                $page->component('User/Organizations/Servers/Show')
                    ->where('server.id', $this->server->id)
                    ->has('server.system_info')
                    ->has('server.last_metrics')
            );
        });

        test('probe configuration management workflow', function () {
            // Step 1: User updates server configuration
            $configData = [
                'collection' => [
                    'cpu' => ['enabled' => true, 'interval' => '30s'],
                    'ram' => ['enabled' => true, 'interval' => '30s'],
                    'service' => ['enabled' => true, 'interval' => '60s'],
                ],
                'sender' => [
                    'target' => 'api',
                    'send_interval' => '5m'
                ]
            ];

            $response = $this->put(
                "/organizations/{$this->organization->id}/servers/{$this->server->id}/config",
                $configData
            );

            $response->assertRedirect("/organizations/{$this->organization->id}/servers/{$this->server->id}");

            // Step 2: Probe validates configuration with API
            $probeConfigData = [
                'machine_name' => 'integration-server',
                'sender' => [
                    'target' => 'api',
                    'send_interval' => '5m'
                ],
                'api' => [
                    'url' => 'https://api.monitorly.io',
                    'organization_id' => $this->organization->id,
                    'server_id' => $this->server->id,
                    'application_token' => 'test-token',
                ],
                'collection' => $configData['collection']
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/config",
                $probeConfigData,
                $this->probeHeaders
            );

            $response->assertStatus(200);

            // Step 3: Probe retrieves updated configuration
            $response = $this->getJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/config",
                $this->probeHeaders
            );

            $response->assertStatus(200);
            $config = $response->json();
            expect($config['collection']['cpu']['interval'])->toBe('30s');
        });
    });

    describe('Multi-Server Environment', function () {
        test('handles multiple servers sending metrics simultaneously', function () {
            // Create additional servers
            $server2 = Server::factory()->create([
                'organization_id' => $this->organization->id,
                'name' => 'server-2',
            ]);

            $server3 = Server::factory()->create([
                'organization_id' => $this->organization->id,
                'name' => 'server-3',
            ]);

            $servers = [$this->server, $server2, $server3];

            // Send metrics from all servers
            foreach ($servers as $index => $server) {
                $metricsData = [
                    'machine_name' => $server->name,
                    'metrics' => [
                        [
                            'timestamp' => now()->toISOString(),
                            'category' => 'system',
                            'name' => 'cpu',
                            'value' => ['usage_percent' => 30 + ($index * 20)]
                        ]
                    ]
                ];

                $response = $this->postJson(
                    "/api/{$this->organization->id}/servers/{$server->id}/metrics",
                    $metricsData,
                    $this->probeHeaders
                );

                $response->assertStatus(200);
            }

            // Verify all metrics were stored correctly
            foreach ($servers as $server) {
                $this->assertDatabaseHas('metrics', [
                    'server_id' => $server->id,
                    'category' => 'system',
                    'name' => 'cpu',
                ]);
            }

            // Verify dashboard shows all servers
            $response = $this->get("/organizations/{$this->organization->id}");
            $response->assertStatus(200);
            $response->assertInertia(fn ($page) =>
                $page->has('servers', 3)
            );
        });

        test('metrics are isolated between organizations', function () {
            // Create another organization and server
            $otherUser = User::factory()->create();
            $otherOrganization = Organization::factory()->create([
                'owner_id' => $otherUser->id,
                'api_key' => 'other-api-key',
            ]);
            $otherServer = Server::factory()->create([
                'organization_id' => $otherOrganization->id,
            ]);

            // Send metrics to both servers
            $metricsData = [
                'machine_name' => 'test-server',
                'metrics' => [
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'cpu',
                        'value' => ['usage_percent' => 50.0]
                    ]
                ]
            ];

            // Send to first organization
            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/metrics",
                $metricsData,
                $this->probeHeaders
            );
            $response->assertStatus(200);

            // Send to second organization
            $otherHeaders = array_merge($this->probeHeaders, [
                'Authorization' => 'Bearer other-api-key'
            ]);
            
            $response = $this->postJson(
                "/api/{$otherOrganization->id}/servers/{$otherServer->id}/metrics",
                $metricsData,
                $otherHeaders
            );
            $response->assertStatus(200);

            // Verify user can only see their organization's metrics
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->server->id}");
            $response->assertStatus(200);

            // Verify user cannot see other organization's server
            $response = $this->get("/organizations/{$otherOrganization->id}/servers/{$otherServer->id}");
            $response->assertStatus(403);
        });
    });

    describe('Historical Data and Analytics', function () {
        test('can retrieve and display historical metrics', function () {
            // Create historical metrics over time
            $timestamps = [
                now()->subHours(3),
                now()->subHours(2),
                now()->subHours(1),
                now(),
            ];

            foreach ($timestamps as $index => $timestamp) {
                Metric::factory()->create([
                    'server_id' => $this->server->id,
                    'category' => 'system',
                    'name' => 'cpu',
                    'value' => ['usage_percent' => 20 + ($index * 15)],
                    'timestamp' => $timestamp,
                ]);
            }

            // User can view metrics page
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->server->id}/metrics");
            $response->assertStatus(200);
            $response->assertInertia(fn ($page) =>
                $page->component('User/Organizations/Servers/Metrics')
                    ->has('metrics')
            );

            // User can filter metrics by date range
            $fromDate = now()->subHours(2)->toDateString();
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->server->id}/metrics?from={$fromDate}");
            $response->assertStatus(200);
        });

        test('metrics aggregation and cleanup works correctly', function () {
            // Create old metrics that should be cleaned up
            $oldMetrics = Metric::factory()->count(5)->create([
                'server_id' => $this->server->id,
                'timestamp' => now()->subDays(35)
            ]);

            // Create recent metrics that should be kept
            $recentMetrics = Metric::factory()->count(3)->create([
                'server_id' => $this->server->id,
                'timestamp' => now()->subHours(2)
            ]);

            // Send new metrics to trigger cleanup
            $metricsData = [
                'machine_name' => 'test-server',
                'metrics' => [
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'cpu',
                        'value' => ['usage_percent' => 50.0]
                    ]
                ]
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/metrics",
                $metricsData,
                $this->probeHeaders
            );

            $response->assertStatus(200);

            // Verify old metrics were cleaned up
            foreach ($oldMetrics as $oldMetric) {
                $this->assertDatabaseMissing('metrics', [
                    'id' => $oldMetric->id
                ]);
            }

            // Verify recent metrics are still there
            foreach ($recentMetrics as $recentMetric) {
                $this->assertDatabaseHas('metrics', [
                    'id' => $recentMetric->id
                ]);
            }
        });
    });

    describe('Error Handling and Recovery', function () {
        test('handles probe disconnection and reconnection', function () {
            // Step 1: Probe sends metrics normally
            $metricsData = [
                'machine_name' => 'test-server',
                'metrics' => [
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'cpu',
                        'value' => ['usage_percent' => 50.0]
                    ]
                ]
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/metrics",
                $metricsData,
                $this->probeHeaders
            );

            $response->assertStatus(200);

            // Server should be online
            $this->server->refresh();
            expect($this->server->status)->toBe('online');

            // Step 2: Simulate probe disconnection (no metrics for a while)
            // Update last_seen_at to simulate time passing
            $this->server->update(['last_seen_at' => now()->subMinutes(15)]);
            
            expect($this->server->isOffline())->toBeTrue();

            // Step 3: Probe reconnects and sends system info again
            $systemInfoData = [
                'machine_name' => 'test-server',
                'metrics' => [
                    [
                        'timestamp' => now()->toISOString(),
                        'category' => 'system',
                        'name' => 'system_info',
                        'value' => [
                            'hostname' => 'test-server',
                            'os' => 'Ubuntu 22.04'
                        ]
                    ]
                ]
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/info",
                $systemInfoData,
                $this->probeHeaders
            );

            $response->assertStatus(200);

            // Server should be online again
            $this->server->refresh();
            expect($this->server->status)->toBe('online');
            expect($this->server->isOnline())->toBeTrue();
        });

        test('handles malformed probe data gracefully', function () {
            // Send invalid metrics data
            $invalidData = [
                'machine_name' => 'test-server',
                'metrics' => [
                    [
                        'timestamp' => 'invalid-timestamp',
                        'category' => 'invalid-category',
                        'name' => '',
                        'value' => null
                    ]
                ]
            ];

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/metrics",
                $invalidData,
                $this->probeHeaders
            );

            $response->assertStatus(400);

            // Server status should not be affected by bad data
            $this->server->refresh();
            expect($this->server->status)->not->toBe('error');
        });
    });

    describe('Performance and Scalability', function () {
        test('handles high volume of metrics efficiently', function () {
            // Send a large batch of metrics
            $metrics = [];
            for ($i = 0; $i < 100; $i++) {
                $metrics[] = [
                    'timestamp' => now()->toISOString(),
                    'category' => 'system',
                    'name' => 'cpu',
                    'value' => ['usage_percent' => rand(10, 90)]
                ];
            }

            $metricsData = [
                'machine_name' => 'test-server',
                'metrics' => $metrics
            ];

            $startTime = microtime(true);

            $response = $this->postJson(
                "/api/{$this->organization->id}/servers/{$this->server->id}/metrics",
                $metricsData,
                $this->probeHeaders
            );

            $endTime = microtime(true);
            $processingTime = $endTime - $startTime;

            $response->assertStatus(200);

            // Should process quickly (under 2 seconds for 100 metrics)
            expect($processingTime)->toBeLessThan(2.0);

            // All metrics should be stored
            $storedMetrics = Metric::where('server_id', $this->server->id)->count();
            expect($storedMetrics)->toBe(100);
        });
    });
});