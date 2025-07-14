<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Free', 'Basic', 'Pro', 'Enterprise']),
            'description' => fake()->paragraph(),
            'price' => json_encode(['monthly' => fake()->randomFloat(2, 0, 99.99), 'yearly' => fake()->randomFloat(2, 0, 999.99)]),
            'frequency' => fake()->numberBetween(5, 60),
            'max_servers' => fake()->numberBetween(1, 100),
            'max_users' => fake()->numberBetween(1, 1000),
            'max_organizations' => fake()->numberBetween(1, 10),
            'max_metrics' => fake()->numberBetween(1000, 100000),
            'max_alerts' => fake()->numberBetween(10, 1000),
        ];
    }

    public function free(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'Free',
                'description' => 'Basic monitoring for small projects',
                'price' => json_encode(['monthly' => 0.00, 'yearly' => 0.00]),
                'frequency' => 60,
                'max_servers' => 1,
                'max_users' => 1,
                'max_organizations' => 1,
                'max_metrics' => 1000,
                'max_alerts' => 10,
            ];
        });
    }

    public function basic(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'Basic',
                'description' => 'Essential monitoring for growing teams',
                'price' => json_encode(['monthly' => 19.99, 'yearly' => 199.99]),
                'frequency' => 30,
                'max_servers' => 5,
                'max_users' => 10,
                'max_organizations' => 3,
                'max_metrics' => 10000,
                'max_alerts' => 50,
            ];
        });
    }

    public function pro(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'Pro',
                'description' => 'Advanced monitoring for professional teams',
                'price' => json_encode(['monthly' => 49.99, 'yearly' => 499.99]),
                'frequency' => 15,
                'max_servers' => 25,
                'max_users' => 50,
                'max_organizations' => 10,
                'max_metrics' => 50000,
                'max_alerts' => 250,
            ];
        });
    }

    public function enterprise(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'Enterprise',
                'description' => 'Complete monitoring solution for large organizations',
                'price' => json_encode(['monthly' => 199.99, 'yearly' => 1999.99]),
                'frequency' => 5,
                'max_servers' => -1,
                'max_users' => -1,
                'max_organizations' => -1,
                'max_metrics' => -1,
                'max_alerts' => -1,
            ];
        });
    }

    public function inactive(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'description' => 'Inactive plan',
            ];
        });
    }

    public function yearly(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'price' => json_encode(['monthly' => 99.99, 'yearly' => 999.99]),
            ];
        });
    }
}
