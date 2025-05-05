<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'price' => 0,
                'frequency' => 60,
                'max_servers' => 1,
                'max_users' => 2,
                'description' => 'Basic monitoring',
            ],
            [
                'name' => 'Pro',
                'price' => 15,
                'frequency' => 15,
                'max_servers' => 10,
                'max_users' => 5,
                'description' => 'Regular monitoring',
            ],
            [
                'name' => 'Business',
                'price' => 49,
                'frequency' => 1,
                'max_servers' => 50,
                'max_users' => 15,
                'description' => 'Advanced monitoring',
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}
