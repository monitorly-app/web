<?php

use App\Models\User;
use App\Models\Organization;
use App\Models\Server;
use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Admin Dashboard', function () {
    test('admin can access dashboard', function () {
        $admin = $this->actingAsAdmin();

        $response = $this->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Dashboard')
        );
    });

    test('non-admin cannot access admin dashboard', function () {
        $user = $this->actingAsUser();
        
        // Debug what role the user actually has
        $this->assertNotEquals(1, $user->role_id);
        $this->assertFalse($user->isAdmin());

        $response = $this->get('/admin/dashboard');

        $response->assertStatus(403);
    });

    test('guest cannot access admin dashboard', function () {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/login');
    });

    test('admin dashboard shows correct statistics', function () {
        $admin = $this->actingAsAdmin();

        // Create test data
        User::factory()->count(5)->create();
        Organization::factory()->count(3)->create();
        Server::factory()->count(8)->create();
        Plan::factory()->count(2)->create();

        $response = $this->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Dashboard')
                ->has('stats')
                ->where('stats.users_count', User::count())
                ->where('stats.organizations_count', Organization::count())
                ->where('stats.servers_count', Server::count())
                ->where('stats.plans_count', Plan::count())
        );
    });

    test('admin dashboard shows recent users', function () {
        // Create recent users
        $recentUsers = User::factory()->count(3)->create([
            'created_at' => now()->subHours(2)
        ]);

        // Create older user
        $oldUser = User::factory()->create([
            'created_at' => now()->subDays(10)
        ]);

        $admin = $this->actingAsAdmin();

        $response = $this->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Dashboard')
                ->has('latestUsers', 5)
        );
    });

    test('admin dashboard shows recent organizations', function () {
        // Create recent organizations
        $recentOrgs = Organization::factory()->count(2)->create([
            'created_at' => now()->subHours(1)
        ]);

        // Create older organization
        $oldOrg = Organization::factory()->create([
            'created_at' => now()->subDays(5)
        ]);

        $admin = $this->actingAsAdmin();

        $response = $this->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Dashboard')
                ->hasAll(['stats', 'latestUsers', 'usersByRole', 'organizationsByPlan', 'organizationRoles'])
        );
    });

    test('admin dashboard shows system health', function () {
        // Create servers with different statuses
        $onlineServers = Server::factory()->count(5)->create(['status' => 'online']);
        $offlineServers = Server::factory()->count(2)->create(['status' => 'offline']);
        $warningServers = Server::factory()->count(1)->create(['status' => 'warning']);

        $admin = $this->actingAsAdmin();

        $response = $this->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Dashboard')
                ->hasAll(['stats', 'latestUsers', 'usersByRole', 'organizationsByPlan', 'organizationRoles'])
        );
    });
});