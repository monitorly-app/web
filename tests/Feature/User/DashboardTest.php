<?php

use App\Models\User;
use App\Models\Organization;
use App\Models\Server;
use App\Models\Metric;

describe('User Dashboard', function () {
    test('user can access dashboard', function () {
        $user = $this->actingAsUser();

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
        );
    });

    test('guest cannot access dashboard', function () {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    });

    test('user dashboard shows owned organizations', function () {
        $user = $this->actingAsUser();
        $ownedOrganizations = Organization::factory()->count(2)->create(['owner_id' => $user->id]);
        $otherOrganization = Organization::factory()->create();

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('ownedOrganizations', 2)
        );
    });

    test('user dashboard shows member organizations', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('memberOrganizations', 1)
        );
    });

    test('user dashboard shows server statistics for owned organizations', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        
        $onlineServers = Server::factory()->count(3)->create([
            'organization_id' => $organization->id,
            'status' => 'online'
        ]);
        
        $offlineServers = Server::factory()->count(2)->create([
            'organization_id' => $organization->id,
            'status' => 'offline'
        ]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('stats')
                ->where('stats.total_servers', 5)
                ->where('stats.online_servers', 3)
                ->where('stats.offline_servers', 2)
        );
    });

    test('user dashboard shows recent activity', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create(['organization_id' => $organization->id]);
        
        // Create recent metrics
        $recentMetrics = Metric::factory()->count(5)->create([
            'server_id' => $server->id,
            'timestamp' => now()->subHours(1)
        ]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('recentActivity')
        );
    });

    test('user dashboard filters data by user permissions', function () {
        $user = $this->actingAsUser();
        $userOrganization = Organization::factory()->create(['owner_id' => $user->id]);
        $otherOrganization = Organization::factory()->create();
        
        $userServer = Server::factory()->create(['organization_id' => $userOrganization->id]);
        $otherServer = Server::factory()->create(['organization_id' => $otherOrganization->id]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->where('stats.total_servers', 1) // Only user's servers
        );
    });

    test('user dashboard shows alerts for critical servers', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        
        $criticalServer = Server::factory()->create([
            'organization_id' => $organization->id,
            'status' => 'offline',
            'last_seen_at' => now()->subHours(2)
        ]);
        
        $warningServer = Server::factory()->create([
            'organization_id' => $organization->id,
            'status' => 'warning'
        ]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('alerts')
        );
    });

    test('user dashboard shows resource usage summary', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $server = Server::factory()->create([
            'organization_id' => $organization->id,
            'last_metrics' => [
                'system.cpu' => ['value' => ['usage_percent' => 75.5]],
                'system.ram' => ['value' => ['usage_percent' => 60.2]],
                'system.disk' => ['value' => ['usage_percent' => 45.8]]
            ]
        ]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('resourceUsage')
        );
    });

    test('user dashboard handles empty state gracefully', function () {
        $user = $this->actingAsUser();
        // User has no organizations or servers

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->where('stats.total_servers', 0)
                ->where('stats.online_servers', 0)
                ->where('stats.offline_servers', 0)
                ->has('ownedOrganizations', 0)
                ->has('memberOrganizations', 0)
        );
    });

    test('user dashboard shows plan information', function () {
        $plan = $this->createPlan([
            'name' => 'Premium Plan',
            'features' => ['max_servers' => 10]
        ]);
        
        $user = $this->actingAsUser(['plan_id' => $plan->id]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('plan')
                ->where('plan.name', 'Premium Plan')
        );
    });

    test('user dashboard shows quick actions', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Dashboard')
                ->has('quickActions')
        );
    });
});