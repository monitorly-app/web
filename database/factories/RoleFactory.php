<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['admin', 'user', 'moderator', 'viewer']),
            'description' => fake()->sentence(),
        ];
    }

    public function admin(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'admin',
                'description' => 'Administrator with full system access',
            ];
        });
    }

    public function user(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'user',
                'description' => 'Regular user with limited access',
            ];
        });
    }

    public function moderator(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'moderator',
                'description' => 'Moderator with elevated privileges',
            ];
        });
    }

    public function viewer(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'viewer',
                'description' => 'Read-only access to system',
            ];
        });
    }
}