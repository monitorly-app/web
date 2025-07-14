<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Plan;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('User Model', function () {
    test('user has fillable attributes', function () {
        $user = new User();
        
        $fillable = [
            'name', 'first_name', 'last_name', 'email', 'password', 'role_id', 'plan_id', 'is_active'
        ];
        
        expect($user->getFillable())->toMatchArray($fillable);
    });

    test('user belongs to a role', function () {
        $role = Role::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        expect($user->role)->toBeInstanceOf(Role::class);
        expect($user->role->id)->toBe($role->id);
    });

    test('user belongs to a plan', function () {
        $plan = Plan::factory()->create();
        $user = User::factory()->create(['plan_id' => $plan->id]);

        expect($user->plan)->toBeInstanceOf(Plan::class);
        expect($user->plan->id)->toBe($plan->id);
    });

    test('user can own organizations', function () {
        $user = User::factory()->create();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        expect($user->ownedOrganizations)->toHaveCount(1);
        expect($user->ownedOrganizations->first())->toBeInstanceOf(Organization::class);
    });

    test('user can be member of organizations', function () {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        expect($user->organizations)->toHaveCount(1);
        expect($user->organizations->first())->toBeInstanceOf(Organization::class);
    });

    test('user can check if admin', function () {
        $adminRole = Role::factory()->create(['name' => 'admin']);
        $userRole = Role::factory()->create(['name' => 'user']);
        
        $admin = User::factory()->create(['role_id' => $adminRole->id]);
        $user = User::factory()->create(['role_id' => $userRole->id]);

        expect($admin->isAdmin())->toBeTrue();
        expect($user->isAdmin())->toBeFalse();
    });

    test('user password is hidden in array representation', function () {
        $user = User::factory()->create(['password' => 'secret']);
        $array = $user->toArray();

        expect($array)->not->toHaveKey('password');
    });

    test('user email is verified on creation', function () {
        $user = User::factory()->create();

        expect($user->email_verified_at)->not->toBeNull();
    });
});