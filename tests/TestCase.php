<?php

namespace Tests;

use App\Models\User;
use App\Models\Role;
use App\Models\Plan;
use App\Models\Organization;
use App\Models\Server;
use App\Models\Metric;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create a user with specified role
     */
    protected function createUserWithRole(string $role = 'admin', array $attributes = []): User
    {
        // For admin role, always use role_id = 1 to match User::isAdmin() method
        if ($role === 'admin') {
            // Create admin role with explicit ID = 1
            $adminRole = Role::firstOrCreate(['name' => 'admin']);
            // Force update to ID = 1 if it's not already
            if ($adminRole->id !== 1) {
                $adminRole->update(['id' => 1]);
            }
            
            return User::factory()->create(array_merge([
                'role_id' => 1,
            ], $attributes));
        }
        
        $roleModel = Role::where('name', $role)->first() ?? Role::factory()->create(['name' => $role]);
        
        return User::factory()->create(array_merge([
            'role_id' => $roleModel->id,
        ], $attributes));
    }

    /**
     * Create an organization with owner
     */
    protected function createOrganization(User $owner = null, array $attributes = []): Organization
    {
        if (!$owner) {
            $owner = $this->createUserWithRole('user');
        }

        return Organization::factory()->create(array_merge([
            'owner_id' => $owner->id,
        ], $attributes));
    }

    /**
     * Create a server for an organization
     */
    protected function createServer(Organization $organization = null, array $attributes = []): Server
    {
        if (!$organization) {
            $organization = $this->createOrganization();
        }

        return Server::factory()->create(array_merge([
            'organization_id' => $organization->id,
        ], $attributes));
    }

    /**
     * Create metrics for a server
     */
    protected function createMetric(Server $server = null, array $attributes = []): Metric
    {
        if (!$server) {
            $server = $this->createServer();
        }

        return Metric::factory()->create(array_merge([
            'server_id' => $server->id,
        ], $attributes));
    }

    /**
     * Create a plan
     */
    protected function createPlan(array $attributes = []): Plan
    {
        return Plan::factory()->create($attributes);
    }

    /**
     * Setup admin user for tests
     */
    protected function actingAsAdmin(array $attributes = []): User
    {
        $admin = $this->createUserWithRole('admin', $attributes);
        $this->actingAs($admin);
        return $admin;
    }

    /**
     * Setup regular user for tests
     */
    protected function actingAsUser(array $attributes = []): User
    {
        // Ensure admin role exists with ID = 1
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        if ($adminRole->id !== 1) {
            $adminRole->update(['id' => 1]);
        }
        
        // Create user role with ID = 2
        $userRole = Role::firstOrCreate(['name' => 'user']);
        if ($userRole->id === 1) {
            $userRole->update(['id' => 2]);
        }
        
        $user = User::factory()->create(array_merge([
            'role_id' => $userRole->id,
        ], $attributes));
        
        $this->actingAs($user);
        return $user;
    }

    /**
     * Create organization member relationship
     */
    protected function addUserToOrganization(User $user, Organization $organization, string $role = 'member'): void
    {
        $organization->members()->attach($user->id, [
            'role' => $role,
            'joined_at' => now(),
        ]);
    }
}
