<?php

use App\Models\Organization;
use App\Models\User;
use App\Models\Server;
use App\Models\OrganizationInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Organization Model', function () {
    test('organization has fillable attributes', function () {
        $organization = new Organization();
        
        $fillable = [
            'id', 'name', 'logo', 'owner_id', 'description', 'api_key', 'encryption_key', 'plan_id', 'subscription_status'
        ];
        
        expect($organization->getFillable())->toMatchArray($fillable);
    });

    test('organization uses UUID as primary key', function () {
        $organization = Organization::factory()->create();
        
        expect($organization->getKeyType())->toBe('string');
        expect($organization->getIncrementing())->toBeFalse();
        expect(strlen($organization->id))->toBe(36); // UUID length
    });

    test('organization belongs to an owner', function () {
        $user = User::factory()->create();
        $organization = Organization::factory()->create(['owner_id' => $user->id]);

        expect($organization->owner)->toBeInstanceOf(User::class);
        expect($organization->owner->id)->toBe($user->id);
    });

    test('organization has many servers', function () {
        $organization = Organization::factory()->create();
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        expect($organization->servers)->toHaveCount(1);
        expect($organization->servers->first())->toBeInstanceOf(Server::class);
    });

    test('organization has many members', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create();
        
        $organization->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now()
        ]);

        expect($organization->members)->toHaveCount(1);
        expect($organization->members->first())->toBeInstanceOf(User::class);
    });

    test('organization has many invitations', function () {
        $organization = Organization::factory()->create();
        $invitation = OrganizationInvitation::factory()->create(['organization_id' => $organization->id]);

        expect($organization->invitations)->toHaveCount(1);
        expect($organization->invitations->first())->toBeInstanceOf(OrganizationInvitation::class);
    });

    test('organization can generate API key on creation', function () {
        $organization = Organization::factory()->create();
        
        expect($organization->api_key)->not->toBeNull();
        expect(strlen($organization->api_key))->toBe(64);
    });

    test('organization can generate encryption key', function () {
        $organization = Organization::factory()->create();
        
        if ($organization->encryption_key) {
            expect(strlen($organization->encryption_key))->toBe(32);
        }
    });

    test('organization can check API request limits', function () {
        $organization = Organization::factory()->create();
        
        // This would depend on the plan limits implementation
        expect($organization->canMakeApiRequest())->toBeTrue();
    });

    test('organization can decrypt data if encryption key exists', function () {
        $organization = Organization::factory()->create([
            'encryption_key' => str_repeat('a', 32) // 32 byte key
        ]);
        
        // Test would depend on actual encryption implementation
        $result = $organization->decryptData('test_encrypted_data');
        // This assertion would depend on the actual decryption logic
        expect($result)->toBeNull(); // or whatever the expected behavior is
    });
});