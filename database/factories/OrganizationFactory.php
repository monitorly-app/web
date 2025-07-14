<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'description' => fake()->paragraph(),
            'owner_id' => User::factory(),
            'api_key' => Str::random(64),
            'encryption_key' => Str::random(32),
        ];
    }

    public function withoutEncryption(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'encryption_key' => null,
            ];
        });
    }

    public function withSpecificApiKey(string $apiKey): static
    {
        return $this->state(function (array $attributes) use ($apiKey) {
            return [
                'api_key' => $apiKey,
            ];
        });
    }
}