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
                'frequency' => 60, // minutes
                'max_servers' => 1, // par projet
                'max_users' => 2, // membres par projet
                'max_projects' => 2,
                'max_metrics' => 10,
                'max_alerts' => -1, // illimité (-1)
                'description' => 'Basic monitoring - Perfect for small projects',
            ],
            [
                'name' => 'Pro',
                'price' => 15,
                'frequency' => 15, // minutes
                'max_servers' => 10, // par projet
                'max_users' => 10, // membres par projet
                'max_projects' => 10,
                'max_metrics' => 100,
                'max_alerts' => -1, // illimité
                'description' => 'Professional monitoring - Great for growing teams',
            ],
            [
                'name' => 'Business',
                'price' => 49,
                'frequency' => 1, // minute
                'max_servers' => 50, // par projet
                'max_users' => 25, // membres par projet
                'max_projects' => -1, // illimité
                'max_metrics' => -1, // illimité
                'max_alerts' => -1, // illimité
                'description' => 'Enterprise monitoring - Unlimited scale for large organizations',
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
