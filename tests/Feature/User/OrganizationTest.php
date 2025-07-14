<?php

use App\Models\User;
use App\Models\Organization;
use App\Models\Server;
use App\Models\OrganizationInvitation;

describe('User Organization Management', function () {
    test('user can view their organizations', function () {
        $user = $this->actingAsUser();
        $ownedOrg = Organization::factory()->create(['owner_id' => $user->id]);
        $memberOrg = Organization::factory()->create();
        
        $memberOrg->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        $response = $this->get('/organizations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Index')
                ->has('organizations', 2)
        );
    });

    test('user can create organization', function () {
        $user = $this->actingAsUser();

        $orgData = [
            'name' => 'My New Organization',
            'description' => 'Test organization',
        ];

        $response = $this->post('/organizations', $orgData);

        $response->assertRedirect('/organizations');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('organizations', [
            'name' => 'My New Organization',
            'owner_id' => $user->id,
        ]);
    });

    test('user can view organization dashboard', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $servers = Server::factory()->count(3)->create(['organization_id' => $organization->id]);

        $response = $this->get("/organizations/{$organization->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Dashboard')
                ->where('organization.id', $organization->id)
                ->has('servers', 3)
        );
    });

    test('user cannot view organization they dont have access to', function () {
        $user = $this->actingAsUser();
        $otherOrganization = Organization::factory()->create();

        $response = $this->get("/organizations/{$otherOrganization->id}");

        $response->assertStatus(403);
    });

    test('organization owner can update organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $updateData = [
            'name' => 'Updated Organization Name',
            'description' => 'Updated description',
        ];

        $response = $this->put("/organizations/{$organization->id}", $updateData);

        $response->assertRedirect("/organizations/{$organization->id}");
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('organizations', [
            'id' => $organization->id,
            'name' => 'Updated Organization Name',
        ]);
    });

    test('organization member cannot update organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ];

        $response = $this->put("/organizations/{$organization->id}", $updateData);

        $response->assertStatus(403);
    });

    test('organization owner can delete organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $response = $this->delete("/organizations/{$organization->id}");

        $response->assertRedirect('/organizations');
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('organizations', [
            'id' => $organization->id,
        ]);
    });

    test('user can view organization members', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $members = User::factory()->count(2)->create();
        
        foreach ($members as $member) {
            $organization->members()->attach($member->id, [
                'role' => 'member',
                'joined_at' => now()
            ]);
        }

        $response = $this->get("/organizations/{$organization->id}/members");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Members')
                ->has('members', 2)
        );
    });

    test('organization owner can invite members', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $invitationData = [
            'email' => 'newmember@example.com',
            'role' => 'member',
        ];

        $response = $this->post("/organizations/{$organization->id}/invitations", $invitationData);

        $response->assertRedirect("/organizations/{$organization->id}/members");
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('organization_invitations', [
            'organization_id' => $organization->id,
            'email' => 'newmember@example.com',
            'role' => 'member',
        ]);
    });

    test('organization owner can remove members', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);
        $member = User::factory()->create();
        
        $organization->members()->attach($member->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        $response = $this->delete("/organizations/{$organization->id}/members/{$member->id}");

        $response->assertRedirect("/organizations/{$organization->id}/members");
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('organization_user', [
            'organization_id' => $organization->id,
            'user_id' => $member->id,
        ]);
    });

    test('user can accept organization invitation', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        $invitation = OrganizationInvitation::factory()->create([
            'organization_id' => $organization->id,
            'email' => $user->email,
            'role' => 'member',
        ]);

        $response = $this->post("/invitations/{$invitation->token}/accept");

        $response->assertRedirect('/organizations');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('organization_user', [
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role' => 'member',
        ]);

        $this->assertDatabaseMissing('organization_invitations', [
            'id' => $invitation->id,
        ]);
    });

    test('user can decline organization invitation', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        $invitation = OrganizationInvitation::factory()->create([
            'organization_id' => $organization->id,
            'email' => $user->email,
        ]);

        $response = $this->post("/invitations/{$invitation->token}/decline");

        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('info');

        $this->assertDatabaseMissing('organization_invitations', [
            'id' => $invitation->id,
        ]);
    });

    test('user can leave organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        $response = $this->delete("/organizations/{$organization->id}/leave");

        $response->assertRedirect('/organizations');
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('organization_user', [
            'organization_id' => $organization->id,
            'user_id' => $user->id,
        ]);
    });

    test('organization owner cannot leave their own organization', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $response = $this->delete("/organizations/{$organization->id}/leave");

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['organization']);
    });

    test('user can view organization settings', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        $response = $this->get("/organizations/{$organization->id}/settings");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('User/Organizations/Settings')
                ->where('organization.id', $organization->id)
        );
    });

    test('organization member cannot access settings', function () {
        $user = $this->actingAsUser();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        $response = $this->get("/organizations/{$organization->id}/settings");

        $response->assertStatus(403);
    });

    test('organization validation works correctly', function () {
        $user = $this->actingAsUser();

        $invalidData = [
            'name' => '', // Required field
            'description' => str_repeat('a', 1001), // Too long
        ];

        $response = $this->post('/organizations', $invalidData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'description']);
    });
});