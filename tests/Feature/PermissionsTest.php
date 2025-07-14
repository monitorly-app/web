<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Organization;
use App\Models\Server;
use App\Models\OrganizationPermission;

describe('Permissions and Roles System', function () {
    
    beforeEach(function () {
        // Create roles
        $this->adminRole = Role::factory()->create(['name' => 'admin']);
        $this->userRole = Role::factory()->create(['name' => 'user']);
        $this->moderatorRole = Role::factory()->create(['name' => 'moderator']);
        
        // Create users with different roles
        $this->admin = User::factory()->create(['role_id' => $this->adminRole->id]);
        $this->user = User::factory()->create(['role_id' => $this->userRole->id]);
        $this->moderator = User::factory()->create(['role_id' => $this->moderatorRole->id]);
        
        // Create organization
        $this->organization = Organization::factory()->create(['owner_id' => $this->user->id]);
        $this->server = Server::factory()->create(['organization_id' => $this->organization->id]);
    });

    describe('Global Admin Permissions', function () {
        test('admin can access admin dashboard', function () {
            $this->actingAs($this->admin);

            $response = $this->get('/admin/dashboard');

            $response->assertStatus(200);
        });

        test('admin can manage all users', function () {
            $this->actingAs($this->admin);

            // Can view users
            $response = $this->get('/admin/users');
            $response->assertStatus(200);

            // Can create user
            $userData = [
                'name' => 'New User',
                'email' => 'newuser@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role_id' => $this->userRole->id,
            ];

            $response = $this->post('/admin/users', $userData);
            $response->assertRedirect('/admin/users');
        });

        test('admin can manage all organizations', function () {
            $this->actingAs($this->admin);

            $response = $this->get('/admin/organizations');
            $response->assertStatus(200);

            $response = $this->get("/admin/organizations/{$this->organization->id}");
            $response->assertStatus(200);
        });

        test('non-admin cannot access admin routes', function () {
            $this->actingAs($this->user);

            $adminRoutes = [
                '/admin/dashboard',
                '/admin/users',
                '/admin/organizations',
                '/admin/plans',
            ];

            foreach ($adminRoutes as $route) {
                $response = $this->get($route);
                $response->assertStatus(403);
            }
        });
    });

    describe('Organization Ownership Permissions', function () {
        test('organization owner has full access to their organization', function () {
            $this->actingAs($this->user);

            // Can view organization
            $response = $this->get("/organizations/{$this->organization->id}");
            $response->assertStatus(200);

            // Can update organization
            $response = $this->put("/organizations/{$this->organization->id}", [
                'name' => 'Updated Name',
                'description' => 'Updated description'
            ]);
            $response->assertRedirect("/organizations/{$this->organization->id}");

            // Can manage servers
            $response = $this->get("/organizations/{$this->organization->id}/servers");
            $response->assertStatus(200);

            // Can create servers
            $serverData = [
                'name' => 'New Server',
                'hostname' => 'new.example.com',
            ];
            $response = $this->post("/organizations/{$this->organization->id}/servers", $serverData);
            $response->assertRedirect("/organizations/{$this->organization->id}/servers");
        });

        test('organization owner can manage members', function () {
            $this->actingAs($this->user);

            // Can view members
            $response = $this->get("/organizations/{$this->organization->id}/members");
            $response->assertStatus(200);

            // Can invite members
            $invitationData = [
                'email' => 'member@example.com',
                'role' => 'member',
            ];
            $response = $this->post("/organizations/{$this->organization->id}/invitations", $invitationData);
            $response->assertRedirect("/organizations/{$this->organization->id}/members");
        });

        test('organization owner can access settings', function () {
            $this->actingAs($this->user);

            $response = $this->get("/organizations/{$this->organization->id}/settings");
            $response->assertStatus(200);
        });
    });

    describe('Organization Member Permissions', function () {
        beforeEach(function () {
            $this->member = User::factory()->create(['role_id' => $this->userRole->id]);
            $this->organization->members()->attach($this->member->id, [
                'role' => 'member',
                'joined_at' => now()
            ]);
        });

        test('organization member can view organization', function () {
            $this->actingAs($this->member);

            $response = $this->get("/organizations/{$this->organization->id}");
            $response->assertStatus(200);
        });

        test('organization member cannot update organization', function () {
            $this->actingAs($this->member);

            $response = $this->put("/organizations/{$this->organization->id}", [
                'name' => 'Unauthorized Update'
            ]);
            $response->assertStatus(403);
        });

        test('organization member cannot access settings', function () {
            $this->actingAs($this->member);

            $response = $this->get("/organizations/{$this->organization->id}/settings");
            $response->assertStatus(403);
        });

        test('organization member cannot manage members', function () {
            $this->actingAs($this->member);

            $invitationData = [
                'email' => 'unauthorized@example.com',
                'role' => 'member',
            ];
            $response = $this->post("/organizations/{$this->organization->id}/invitations", $invitationData);
            $response->assertStatus(403);
        });
    });

    describe('Organization Admin Member Permissions', function () {
        beforeEach(function () {
            $this->orgAdmin = User::factory()->create(['role_id' => $this->userRole->id]);
            $this->organization->members()->attach($this->orgAdmin->id, [
                'role' => 'admin',
                'joined_at' => now()
            ]);
        });

        test('organization admin can manage servers', function () {
            $this->actingAs($this->orgAdmin);

            // Can view servers
            $response = $this->get("/organizations/{$this->organization->id}/servers");
            $response->assertStatus(200);

            // Can create servers
            $serverData = [
                'name' => 'Admin Server',
                'hostname' => 'admin.example.com',
            ];
            $response = $this->post("/organizations/{$this->organization->id}/servers", $serverData);
            $response->assertRedirect("/organizations/{$this->organization->id}/servers");
        });

        test('organization admin can manage members', function () {
            $this->actingAs($this->orgAdmin);

            $invitationData = [
                'email' => 'adminmember@example.com',
                'role' => 'member',
            ];
            $response = $this->post("/organizations/{$this->organization->id}/invitations", $invitationData);
            $response->assertRedirect("/organizations/{$this->organization->id}/members");
        });

        test('organization admin cannot access settings', function () {
            $this->actingAs($this->orgAdmin);

            $response = $this->get("/organizations/{$this->organization->id}/settings");
            $response->assertStatus(403);
        });
    });

    describe('Organization Viewer Permissions', function () {
        beforeEach(function () {
            $this->viewer = User::factory()->create(['role_id' => $this->userRole->id]);
            $this->organization->members()->attach($this->viewer->id, [
                'role' => 'viewer',
                'joined_at' => now()
            ]);
        });

        test('organization viewer can only view data', function () {
            $this->actingAs($this->viewer);

            // Can view organization
            $response = $this->get("/organizations/{$this->organization->id}");
            $response->assertStatus(200);

            // Can view servers
            $response = $this->get("/organizations/{$this->organization->id}/servers");
            $response->assertStatus(200);

            // Can view specific server
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->server->id}");
            $response->assertStatus(200);
        });

        test('organization viewer cannot create or modify data', function () {
            $this->actingAs($this->viewer);

            // Cannot create servers
            $serverData = [
                'name' => 'Unauthorized Server',
                'hostname' => 'unauthorized.example.com',
            ];
            $response = $this->post("/organizations/{$this->organization->id}/servers", $serverData);
            $response->assertStatus(403);

            // Cannot update servers
            $response = $this->put("/organizations/{$this->organization->id}/servers/{$this->server->id}", [
                'name' => 'Unauthorized Update'
            ]);
            $response->assertStatus(403);

            // Cannot delete servers
            $response = $this->delete("/organizations/{$this->organization->id}/servers/{$this->server->id}");
            $response->assertStatus(403);
        });
    });

    describe('Cross-Organization Access Control', function () {
        beforeEach(function () {
            $this->otherUser = User::factory()->create(['role_id' => $this->userRole->id]);
            $this->otherOrganization = Organization::factory()->create(['owner_id' => $this->otherUser->id]);
            $this->otherServer = Server::factory()->create(['organization_id' => $this->otherOrganization->id]);
        });

        test('user cannot access other organizations data', function () {
            $this->actingAs($this->user);

            // Cannot view other organization
            $response = $this->get("/organizations/{$this->otherOrganization->id}");
            $response->assertStatus(403);

            // Cannot view other organization servers
            $response = $this->get("/organizations/{$this->otherOrganization->id}/servers");
            $response->assertStatus(403);

            // Cannot access other organization servers directly
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->otherServer->id}");
            $response->assertStatus(404);
        });

        test('server access is restricted by organization membership', function () {
            $this->actingAs($this->user);

            // User can access their own organization's server
            $response = $this->get("/organizations/{$this->organization->id}/servers/{$this->server->id}");
            $response->assertStatus(200);

            // User cannot access other organization's server
            $response = $this->get("/organizations/{$this->otherOrganization->id}/servers/{$this->otherServer->id}");
            $response->assertStatus(403);
        });
    });

    describe('Permission Middleware', function () {
        test('auth middleware protects authenticated routes', function () {
            $protectedRoutes = [
                '/dashboard',
                '/organizations',
                "/organizations/{$this->organization->id}",
            ];

            foreach ($protectedRoutes as $route) {
                $response = $this->get($route);
                $response->assertRedirect('/login');
            }
        });

        test('admin middleware protects admin routes', function () {
            $this->actingAs($this->user);

            $adminRoutes = [
                '/admin/dashboard',
                '/admin/users',
                '/admin/organizations',
            ];

            foreach ($adminRoutes as $route) {
                $response = $this->get($route);
                $response->assertStatus(403);
            }
        });

        test('organization access middleware works correctly', function () {
            $outsider = User::factory()->create(['role_id' => $this->userRole->id]);
            $this->actingAs($outsider);

            $response = $this->get("/organizations/{$this->organization->id}");
            $response->assertStatus(403);
        });
    });

    describe('Role-Based Feature Access', function () {
        test('different roles have different feature access', function () {
            // Admin has access to all features
            $this->actingAs($this->admin);
            $response = $this->get('/admin/users');
            $response->assertStatus(200);

            // User has access to user features
            $this->actingAs($this->user);
            $response = $this->get('/dashboard');
            $response->assertStatus(200);

            // But user cannot access admin features
            $response = $this->get('/admin/users');
            $response->assertStatus(403);
        });

        test('organization permissions are enforced on API endpoints', function () {
            $this->actingAs($this->user);

            // Can access own organization's data
            $response = $this->get("/api/organizations/{$this->organization->id}/servers");
            $response->assertStatus(200);

            // Cannot access other organization's data
            $otherOrg = Organization::factory()->create();
            $response = $this->get("/api/organizations/{$otherOrg->id}/servers");
            $response->assertStatus(403);
        });
    });
});