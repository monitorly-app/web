<?php

namespace Database\Factories;

use App\Models\OrganizationRole;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrganizationRoleFactory extends Factory
{
    protected $model = OrganizationRole::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Owner', 'Admin', 'Engineer', 'Developer', 'Viewer']),
            'description' => fake()->sentence(),
        ];
    }

    public function owner(): static
    {
        return $this->state([
            'name' => 'Owner',
            'description' => 'Full access to organization, including billing and settings',
        ]);
    }

    public function admin(): static
    {
        return $this->state([
            'name' => 'Admin',
            'description' => 'Administrative access to manage users and settings',
        ]);
    }

    public function engineer(): static
    {
        return $this->state([
            'name' => 'Engineer',
            'description' => 'Full access to servers and monitoring',
        ]);
    }

    public function developer(): static
    {
        return $this->state([
            'name' => 'Developer',
            'description' => 'Read and write access to servers',
        ]);
    }

    public function viewer(): static
    {
        return $this->state([
            'name' => 'Viewer',
            'description' => 'Read-only access to monitoring data',
        ]);
    }
}