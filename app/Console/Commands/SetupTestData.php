<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Organization;
use App\Models\Server;
use App\Models\Plan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SetupTestData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'setup:test-data {--reset : Reset existing test data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test user, organization, and server for probe testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Setting up test data for Monitorly probe testing...');

        if ($this->option('reset')) {
            $this->resetTestData();
        }

        // 1. Create or get test user
        $user = $this->createTestUser();
        $this->info("✅ User created: {$user->email}");

        // 2. Create test organization
        $organization = $this->createTestOrganization($user);
        $this->info("✅ Organization created: {$organization->name}");

        // 3. Create test server
        $server = $this->createTestServer($organization);
        $this->info("✅ Server created: {$server->name}");

        // 4. Output configuration for probe
        $this->outputConfiguration($organization, $server);

        // 5. Generate probe config file
        $this->generateProbeConfig($organization, $server);

        $this->info('');
        $this->info('🎉 Setup complete! You can now:');
        $this->info('1. Login to the web interface with: test@monitorly.dev / password');
        $this->info('2. Run the probe with: cd ../probe && go run ./cmd/probe -config config.yaml -skip-update-check');
        $this->info('3. Or use the automated script: python ../setup_and_run.py');
    }

    private function resetTestData()
    {
        $this->info('🧹 Resetting test data...');

        // Delete test organizations first
        $testOrgs = Organization::where('name', 'Test Organization')->get();
        foreach ($testOrgs as $org) {
            $org->delete();
        }
        if ($testOrgs->count() > 0) {
            $this->info('   Deleted test organizations');
        }
        
        // Delete test user
        $testUser = User::where('email', 'test@monitorly.dev')->first();
        if ($testUser) {
            $testUser->delete();
            $this->info('   Deleted test user');
        }
    }

    private function createTestUser(): User
    {
        $user = User::where('email', 'test@monitorly.dev')->first();

        if (!$user) {
            // Get Free plan

            $user = User::create([
                'name' => 'Test User',
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test@monitorly.dev',
                'password' => Hash::make('password'),
                'role_id' => 2, // User role
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }

        return $user;
    }

    private function createTestOrganization(User $user): Organization
    {
        $organization = Organization::where('name', 'Test Organization')
                                  ->where('owner_id', $user->id)
                                  ->first();

        if (!$organization) {
            $freePlan = Plan::where('name', 'Free')->first();
            
            $organization = Organization::create([
                'name' => 'Test Organization',
                'description' => 'Test organization for probe development',
                'owner_id' => $user->id,
                'plan_id' => $freePlan?->id,
                'api_key' => 'org_test_' . Str::random(32),
                'encryption_key' => Str::random(32),
                'subscription_status' => 'active',
            ]);

            // Add user as owner to organization
            $organization->members()->attach($user->id, [
                'organization_role_id' => 1 // Owner role
            ]);
        }

        return $organization;
    }

    private function createTestServer(Organization $organization): Server
    {
        $server = $organization->servers()->where('name', 'test-probe-server')->first();

        if (!$server) {
            $server = Server::create([
                'name' => 'test-probe-server',
                'hostname' => 'test-probe-server.local',
                'ip_address' => '127.0.0.1',
                'description' => 'Test server for probe development',
                'os' => 'Linux',
                'status' => 'offline',
                'organization_id' => $organization->id,
                'token' => Str::random(64),
                'monitoring_config' => [
                    'collection' => [
                        'cpu' => ['enabled' => true, 'interval' => '30s'],
                        'ram' => ['enabled' => true, 'interval' => '30s'],
                        'disk' => ['enabled' => true, 'interval' => '60s'],
                        'service' => ['enabled' => true, 'interval' => '60s'],
                        'user_activity' => ['enabled' => true, 'interval' => '60s'],
                        'login_failures' => ['enabled' => true, 'interval' => '60s'],
                        'port' => ['enabled' => true, 'interval' => '60s'],
                    ],
                    'sender' => [
                        'target' => 'api',
                        'send_interval' => '5m'
                    ]
                ],
                'monitoring_config_updated_at' => now(),
            ]);
        }

        return $server;
    }

    private function outputConfiguration(Organization $organization, Server $server)
    {
        $this->info('');
        $this->info('📋 Test Data Configuration:');
        $this->info('');

        $this->table(['Key', 'Value'], [
            ['User Email', 'test@monitorly.dev'],
            ['User Password', 'password'],
            ['Organization ID', $organization->id],
            ['Organization Name', $organization->name],
            ['Organization API Key', $organization->api_key],
            ['Organization Encryption Key', $organization->encryption_key],
            ['Server ID', $server->id],
            ['Server Name', $server->name],
            ['Server Token', $server->token],
            ['Web URL', config('app.url')],
        ]);
    }

    private function generateProbeConfig(Organization $organization, Server $server)
    {
        $config = [
            'machine_name' => $server->name,
            'collection' => [
                'cpu' => [
                    'enabled' => true,
                    'interval' => '30s'
                ],
                'ram' => [
                    'enabled' => true,
                    'interval' => '30s'
                ],
                'disk' => [
                    'enabled' => true,
                    'interval' => '60s',
                    'mount_points' => [
                        [
                            'path' => '/',
                            'label' => 'root',
                            'collect_usage' => true,
                            'collect_percent' => true
                        ]
                    ]
                ],
                'service' => [
                    'enabled' => true,
                    'interval' => '60s',
                    'services' => [
                        [
                            'name' => 'nginx',
                            'label' => 'Nginx Web Server'
                        ],
                        [
                            'name' => 'mysql',
                            'label' => 'MySQL Database'
                        ]
                    ]
                ],
                'user_activity' => [
                    'enabled' => true,
                    'interval' => '60s'
                ],
                'login_failures' => [
                    'enabled' => true,
                    'interval' => '60s'
                ],
                'port' => [
                    'enabled' => true,
                    'interval' => '60s'
                ]
            ],
            'sender' => [
                'target' => 'api',
                'send_interval' => '5m'
            ],
            'api' => [
                'url' => 'http://localhost:8000',
                'organization_id' => $organization->id,
                'server_id' => $server->id,
                'application_token' => $organization->api_key,
                'encryption_key' => $organization->encryption_key
            ],
            'logging' => [
                'file_path' => 'logs/monitorly.log'
            ],
            'updates' => [
                'enabled' => true,
                'check_time' => '03:00',
                'retry_delay' => '1h'
            ]
        ];

        // Write YAML config to probe directory
        $probeConfigPath = base_path('../probe/config.yaml');
        $yamlContent = $this->arrayToYaml($config);

        if (file_put_contents($probeConfigPath, $yamlContent)) {
            $this->info("✅ Probe configuration written to: {$probeConfigPath}");
        } else {
            $this->error("❌ Failed to write probe configuration");
        }
    }

    private function arrayToYaml(array $array, int $indent = 0): string
    {
        $yaml = '';
        $indentStr = str_repeat('  ', $indent);

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                // Check if it's a numeric array (list)
                if (array_keys($value) === range(0, count($value) - 1)) {
                    // This is a list/array
                    $yaml .= $indentStr . $key . ":\n";
                    foreach ($value as $item) {
                        if (is_array($item)) {
                            $yaml .= $indentStr . "  -\n";
                            foreach ($item as $itemKey => $itemValue) {
                                $yaml .= $indentStr . "    " . $itemKey . ': ';
                                if (is_string($itemValue)) {
                                    $yaml .= '"' . $itemValue . '"';
                                } elseif (is_bool($itemValue)) {
                                    $yaml .= $itemValue ? 'true' : 'false';
                                } else {
                                    $yaml .= $itemValue;
                                }
                                $yaml .= "\n";
                            }
                        } else {
                            $yaml .= $indentStr . '  - ';
                            if (is_string($item)) {
                                $yaml .= '"' . $item . '"';
                            } elseif (is_bool($item)) {
                                $yaml .= $item ? 'true' : 'false';
                            } else {
                                $yaml .= $item;
                            }
                            $yaml .= "\n";
                        }
                    }
                } else {
                    // This is an associative array/object
                    $yaml .= $indentStr . $key . ":\n";
                    $yaml .= $this->arrayToYaml($value, $indent + 1);
                }
            } else {
                $yaml .= $indentStr . $key . ': ';
                if (is_string($value)) {
                    $yaml .= '"' . $value . '"';
                } elseif (is_bool($value)) {
                    $yaml .= $value ? 'true' : 'false';
                } else {
                    $yaml .= $value;
                }
                $yaml .= "\n";
            }
        }

        return $yaml;
    }
}
