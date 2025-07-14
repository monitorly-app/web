<?php

use App\Models\User;
use App\Models\Organization;
use App\Models\Server;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Admin Organization Supervision', function () {
    test('admin can view organizations list', function () {
        $admin = $this->actingAsAdmin();
        $organizations = Organization::factory()->count(3)->create();

        $response = $this->get('/admin/organizations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('organizations.data', 3)
        );
    });

    test('admin can search organizations by name', function () {
        $admin = $this->actingAsAdmin();
        $searchableOrg = Organization::factory()->create(['name' => 'Tech Corp']);
        $otherOrg = Organization::factory()->create(['name' => 'Media Inc']);

        $response = $this->get('/admin/organizations?search=Tech');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('organizations.data', 1)
                ->where('organizations.data.0.name', 'Tech Corp')
        );
    });

    test('admin can filter organizations by status', function () {
        $admin = $this->actingAsAdmin();
        $activeOrg = Organization::factory()->create(['subscription_status' => 'active']);
        $suspendedOrg = Organization::factory()->create(['subscription_status' => 'suspended']);

        $response = $this->get('/admin/organizations?status=suspended');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('organizations.data', 1)
                ->where('organizations.data.0.subscription_status', 'suspended')
        );
    });

    test('admin can view organization details for supervision', function () {
        $admin = $this->actingAsAdmin();
        $owner = User::factory()->create();
        $organization = Organization::factory()->create(['owner_id' => $owner->id]);
        Server::factory()->count(3)->create(['organization_id' => $organization->id]);

        $response = $this->get("/admin/organizations/{$organization->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Organizations/Show')
                ->where('organization.id', $organization->id)
                ->where('organization.name', $organization->name)
                ->has('stats')
        );
    });

    test('admin can suspend organization', function () {
        $admin = $this->actingAsAdmin();
        $organization = Organization::factory()->create(['subscription_status' => 'active']);

        $response = $this->post("/admin/organizations/{$organization->id}/suspend");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $organization->refresh();
        expect($organization->subscription_status)->toBe('suspended');
    });

    test('admin can reactivate suspended organization', function () {
        $admin = $this->actingAsAdmin();
        $organization = Organization::factory()->create(['subscription_status' => 'suspended']);

        $response = $this->post("/admin/organizations/{$organization->id}/reactivate");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $organization->refresh();
        expect($organization->subscription_status)->toBe('active');
    });

    test('admin can regenerate organization API key for support', function () {
        $admin = $this->actingAsAdmin();
        $organization = Organization::factory()->create();
        $originalApiKey = $organization->api_key;

        $response = $this->post("/admin/organizations/{$organization->id}/regenerate-api-key");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $organization->refresh();
        expect($organization->api_key)->not->toBe($originalApiKey);
        expect(strlen($organization->api_key))->toBe(64);
        expect($organization->api_requests_count)->toBe(0);
    });

    test('admin can view organization members for supervision', function () {
        $admin = $this->actingAsAdmin();
        $organization = Organization::factory()->create();
        $organizationRole = \App\Models\OrganizationRole::factory()->create();
        $members = User::factory()->count(3)->create();
        
        foreach ($members as $member) {
            $organization->members()->attach($member->id, [
                'organization_role_id' => $organizationRole->id,
            ]);
        }

        $response = $this->get("/admin/organizations/{$organization->id}/members");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Organizations/Members')
                ->has('members', 3)
        );
    });

    test('admin can view organization servers for supervision', function () {
        $admin = $this->actingAsAdmin();
        $organization = Organization::factory()->create();
        Server::factory()->count(3)->create(['organization_id' => $organization->id]);

        $response = $this->get("/admin/organizations/{$organization->id}/servers");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Organizations/Servers')
                ->has('servers.data', 3)
        );
    });

    test('admin can get organization stats', function () {
        $admin = $this->actingAsAdmin();
        Organization::factory()->count(5)->create(['subscription_status' => 'active']);
        Organization::factory()->count(2)->create(['subscription_status' => 'suspended']);

        $response = $this->get('/admin/organizations/stats');

        $response->assertStatus(200);
        $response->assertJson([
            'total' => 7,
            'active' => 5,
            'suspended' => 2,
        ]);
    });

    test('non-admin cannot access organization supervision', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();

        $routes = [
            '/admin/organizations',
            "/admin/organizations/{$organization->id}",
            "/admin/organizations/{$organization->id}/members",
            "/admin/organizations/{$organization->id}/servers",
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $response->assertStatus(403);
        }
    });

    test('admin can export organizations data', function () {
        $admin = $this->actingAsAdmin();
        Organization::factory()->count(5)->create();

        $response = $this->get('/admin/organizations/export');

        $response->assertStatus(200);
        $response->assertHeader('content-disposition');
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    });
});