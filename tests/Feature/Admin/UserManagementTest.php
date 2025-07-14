<?php

use App\Models\User;
use App\Models\Role;

describe('Admin User Management', function () {
    test('admin can view users list', function () {
        $admin = $this->actingAsAdmin();
        $users = User::factory()->count(3)->create();

        $response = $this->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Users/Index')
                ->has('users.data', 4) // 3 created + 1 admin
        );
    });

    test('admin can search users', function () {
        $admin = $this->actingAsAdmin();
        $searchableUser = User::factory()->create(['name' => 'John Doe']);
        $otherUser = User::factory()->create(['name' => 'Jane Smith']);

        $response = $this->get('/admin/users?search=John');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('users.data', 1)
                ->where('users.data.0.name', 'John Doe')
        );
    });

    test('admin can filter users by role', function () {
        $admin = $this->actingAsAdmin();
        $userRole = Role::factory()->create(['name' => 'user']);
        $users = User::factory()->count(2)->create(['role_id' => $userRole->id]);

        $response = $this->get('/admin/users?role=user');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('users.data', 2)
        );
    });

    test('admin can create new user', function () {
        $admin = $this->actingAsAdmin();
        $role = Role::factory()->create(['name' => 'user']);

        $userData = [
            'first_name' => 'New',
            'last_name' => 'User',
            'email' => 'newuser@example.com',
            'role_id' => $role->id,
        ];

        $response = $this->post('/admin/users', $userData);

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'role_id' => $role->id,
        ]);
    });

    test('admin can view user details', function () {
        $admin = $this->actingAsAdmin();
        $user = User::factory()->create();

        $response = $this->get("/admin/users/{$user->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Users/Show')
                ->where('user.id', $user->id)
                ->where('user.name', $user->name)
        );
    });

    test('admin can update user', function () {
        $admin = $this->actingAsAdmin();
        $user = User::factory()->create();
        $newRole = Role::factory()->create(['name' => 'moderator']);

        $updateData = [
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'email' => $user->email,
            'role_id' => $newRole->id,
            'is_active' => true,
        ];

        $response = $this->put("/admin/users/{$user->id}", $updateData);

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'role_id' => $newRole->id,
        ]);
    });

    test('admin can delete user', function () {
        $admin = $this->actingAsAdmin();
        $user = User::factory()->create();

        $response = $this->delete("/admin/users/{$user->id}");

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    });

    test('admin cannot delete themselves', function () {
        $admin = $this->actingAsAdmin();

        $response = $this->delete("/admin/users/{$admin->id}");

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
        ]);
    });

    test('user validation works correctly', function () {
        $admin = $this->actingAsAdmin();
        $existingUser = User::factory()->create();

        $invalidData = [
            'first_name' => '', // Required field
            'last_name' => '', // Required field
            'email' => 'invalid-email', // Invalid email
            'role_id' => 999, // Non-existent role
        ];

        $response = $this->post('/admin/users', $invalidData);

        $response->assertRedirect();
        $response->assertSessionHasErrors(['first_name', 'last_name', 'email', 'role_id']);
    });

    test('admin can bulk delete users', function () {
        $admin = $this->actingAsAdmin();
        $users = User::factory()->count(3)->create();
        $userIds = $users->pluck('id')->toArray();

        $response = $this->delete('/admin/users/bulk', [
            'user_ids' => $userIds
        ]);

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('success');

        foreach ($userIds as $userId) {
            $this->assertDatabaseMissing('users', ['id' => $userId]);
        }
    });

    test('non-admin cannot access user management', function () {
        $user = $this->actingAsUser();

        $routes = [
            '/admin/users',
            '/admin/users/create',
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $response->assertStatus(403);
        }
    });

    test('admin can export users', function () {
        $admin = $this->actingAsAdmin();
        $users = User::factory()->count(5)->create();

        $response = $this->get('/admin/users/export');

        $response->assertStatus(200);
        $response->assertHeader('content-disposition');
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    });
});