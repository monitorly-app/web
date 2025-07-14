<?php

use App\Models\User;
use App\Models\Organization;
use App\Models\Server;
use App\Models\Metric;

describe('User Server Management', function () {
    test('user can view servers in their organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $servers = Server::factory()->count(3)->create(['organization_id' => $organization->id]);
        $otherServer = Server::factory()->create(); // Different organization

        $response = $this->get("/organizations/{$organization->id}/servers");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Servers/Index')
                ->has('servers', 3)
        );
    });

    test('user can create server in their organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $serverData = [
            'name' => 'Test Server',
            'hostname' => 'test.example.com',
            'ip_address' => '192.168.1.100',
            'description' => 'Test server description',
            'os' => 'Ubuntu 22.04',
        ];

        $response = $this->post("/organizations/{$organization->id}/servers", $serverData);

        $response->assertRedirect("/organizations/{$organization->id}/servers");
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('servers', [
            'name' => 'Test Server',
            'organization_id' => $organization->id,
            'hostname' => 'test.example.com',
        ]);
    });

    test('user cannot create server in organization they dont own', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();

        $serverData = [
            'name' => 'Test Server',
            'hostname' => 'test.example.com',
        ];

        $response = $this->post("/organizations/{$organization->id}/servers", $serverData);

        $response->assertStatus(403);
    });

    test('user can view server details', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create([
            'organization_id' => $organization->id,
            'system_info' => [
                'hostname' => 'test-server',
                'os' => 'Ubuntu 22.04',
                'cpu' => ['cores' => 4]
            ],
            'last_metrics' => [
                'system.cpu' => ['value' => ['usage_percent' => 75.5]],
                'system.ram' => ['value' => ['usage_percent' => 60.2]]
            ]
        ]);

        $response = $this->get("/organizations/{$organization->id}/servers/{$server->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Servers/Show')
                ->where('server.id', $server->id)
                ->has('server.system_info')
                ->has('server.last_metrics')
        );
    });

    test('user cannot view server from different organization', function () {
        $user = $this->actingAsUser();
        $userOrganization = Organization::factory()->create(['owner_id' => $user->id]);
        $otherOrganization = Organization::factory()->create();
        $otherServer = Server::factory()->create(['organization_id' => $otherOrganization->id]);

        $response = $this->get("/organizations/{$userOrganization->id}/servers/{$otherServer->id}");

        $response->assertStatus(404);
    });

    test('user can update server', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        $updateData = [
            'name' => 'Updated Server Name',
            'description' => 'Updated description',
            'ip_address' => '192.168.1.200',
        ];

        $response = $this->put("/organizations/{$organization->id}/servers/{$server->id}", $updateData);

        $response->assertRedirect("/organizations/{$organization->id}/servers/{$server->id}");
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('servers', [
            'id' => $server->id,
            'name' => 'Updated Server Name',
            'ip_address' => '192.168.1.200',
        ]);
    });

    test('user can delete server', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        $response = $this->delete("/organizations/{$organization->id}/servers/{$server->id}");

        $response->assertRedirect("/organizations/{$organization->id}/servers");
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('servers', [
            'id' => $server->id,
        ]);
    });

    test('user can regenerate server token', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);
        $originalToken = $server->token;

        $response = $this->post("/organizations/{$organization->id}/servers/{$server->id}/regenerate-token");

        $response->assertRedirect("/organizations/{$organization->id}/servers/{$server->id}");
        $response->assertSessionHas('success');

        $server->refresh();
        expect($server->token)->not->toBe($originalToken);
    });

    test('user can get server install script', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        $response = $this->get("/organizations/{$organization->id}/servers/{$server->id}/install-script");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/plain; charset=UTF-8');
        
        $content = $response->getContent();
        expect($content)->toContain('#!/bin/bash');
        expect($content)->toContain($server->token);
    });

    test('user can view server metrics', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);
        
        $metrics = Metric::factory()->count(10)->create([
            'server_id' => $server->id,
            'category' => 'system',
            'name' => 'cpu',
            'timestamp' => now()->subHours(rand(1, 24))
        ]);

        $response = $this->get("/organizations/{$organization->id}/servers/{$server->id}/metrics");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Servers/Metrics')
                ->has('metrics')
        );
    });

    test('user can filter server metrics by date range', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);
        
        // Create metrics with different timestamps
        $oldMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()->subDays(5)
        ]);
        
        $recentMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()->subHours(2)
        ]);

        $response = $this->get("/organizations/{$organization->id}/servers/{$server->id}/metrics?from=" . now()->subDays(1)->toDateString());

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('metrics')
        );
    });

    test('user can view server logs', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        $response = $this->get("/organizations/{$organization->id}/servers/{$server->id}/logs");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Servers/Logs')
        );
    });

    test('user can configure server monitoring', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        $configData = [
            'collection' => [
                'cpu' => ['enabled' => true, 'interval' => '30s'],
                'ram' => ['enabled' => true, 'interval' => '30s'],
                'disk' => ['enabled' => true, 'interval' => '60s'],
            ],
            'sender' => [
                'target' => 'api',
                'send_interval' => '5m'
            ]
        ];

        $response = $this->put("/organizations/{$organization->id}/servers/{$server->id}/config", $configData);

        $response->assertRedirect("/organizations/{$organization->id}/servers/{$server->id}");
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('servers', [
            'id' => $server->id,
        ]);

        $server->refresh();
        expect($server->monitoring_config)->toMatchArray($configData);
    });

    test('organization member with correct permissions can manage servers', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'admin',
            'joined_at' => now()
        ]);

        $serverData = [
            'name' => 'Member Server',
            'hostname' => 'member.example.com',
        ];

        $response = $this->post("/organizations/{$organization->id}/servers", $serverData);

        $response->assertRedirect("/organizations/{$organization->id}/servers");
        $response->assertSessionHas('success');
    });

    test('organization member without permissions cannot manage servers', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'viewer',
            'joined_at' => now()
        ]);

        $serverData = [
            'name' => 'Unauthorized Server',
            'hostname' => 'unauthorized.example.com',
        ];

        $response = $this->post("/organizations/{$organization->id}/servers", $serverData);

        $response->assertStatus(403);
    });

    test('server validation works correctly', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $invalidData = [
            'name' => '', // Required field
            'hostname' => 'invalid hostname with spaces',
            'ip_address' => 'invalid-ip',
        ];

        $response = $this->post("/organizations/{$organization->id}/servers", $invalidData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'hostname', 'ip_address']);
    });

    test('user can export server metrics', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);
        
        $metrics = Metric::factory()->count(5)->create(['server_id' => $server->id]);

        $response = $this->get("/organizations/{$organization->id}/servers/{$server->id}/metrics/export");

        $response->assertStatus(200);
        $response->assertHeader('content-disposition');
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    });
});