<?php

namespace Database\Factories;

use App\Models\OrganizationInvitation;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrganizationInvitationFactory extends Factory
{
    protected $model = OrganizationInvitation::class;

    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'email' => fake()->unique()->safeEmail(),
            'role' => fake()->randomElement(['member', 'admin', 'viewer']),
            'token' => Str::random(64),
            'invited_by' => User::factory(),
            'expires_at' => now()->addDays(7),
        ];
    }

    public function member(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'member',
            ];
        });
    }

    public function admin(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'admin',
            ];
        });
    }

    public function viewer(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'viewer',
            ];
        });
    }

    public function expired(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'expires_at' => now()->subDays(1),
            ];
        });
    }

    public function expiringSoon(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'expires_at' => now()->addHours(2),
            ];
        });
    }

    public function withSpecificEmail(string $email): static
    {
        return $this->state(function (array $attributes) use ($email) {
            return [
                'email' => $email,
            ];
        });
    }

    public function withSpecificToken(string $token): static
    {
        return $this->state(function (array $attributes) use ($token) {
            return [
                'token' => $token,
            ];
        });
    }
}