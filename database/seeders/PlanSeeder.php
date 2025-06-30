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
                'price' => [
                    'monthly' => 0,
                    'yearly' => 0
                ],
                'frequency' => 60,
                'max_servers' => 1,
                'max_users' => 2,
                'max_organizations' => 1,
                'max_metrics' => 10,
                'max_alerts' => -1,
                'description' => 'Basic monitoring - Perfect for small organizations',
            ],
            [
                'name' => 'Pro',
                'price' => [
                    'monthly' => 9,
                    'yearly' => 97 // 9 * 12 = 108, avec -10% = 97€
                ],
                'frequency' => 15, // minutes
                'max_servers' => 10, // par organisation
                'max_users' => 10, // membres par organisation
                'max_organizations' => 3, // nombre d'organisations
                'max_metrics' => 100,
                'max_alerts' => -1, // illimité
                'description' => 'Professional monitoring - Great for growing teams',
            ],
            [
                'name' => 'Business',
                'price' => [
                    'monthly' => 29,
                    'yearly' => 313 // 29 * 12 = 348, avec -10% = 313€
                ],
                'frequency' => 1, // minute
                'max_servers' => 50, // par organisation
                'max_users' => 25, // membres par organisation
                'max_organizations' => -1, // illimité
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
