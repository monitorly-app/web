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
                'max_servers' => 3,         // 3 serveurs par org (total 9 avec 3 orgs)
                'max_users' => -1,          // Membres illimités par org
                'max_organizations' => 3,   // 3 organisations max
                'max_metrics' => 10,
                'max_alerts' => -1,
                'description' => 'Perfect for small organizations',
                'is_active' => true,
            ],
            [
                'name' => 'Pro',
                'price' => [
                    'monthly' => 39,    // Prix ajusté pour 5 orgs × 10 serveurs
                    'yearly' => 420     // 39 * 12 = 468, avec -10% = 420€
                ],
                'frequency' => 15, // minutes
                'max_servers' => 10, // par organisation
                'max_users' => -1,   // membres illimités par organisation
                'max_organizations' => 5, // 5 organisations (total 50 serveurs)
                'max_metrics' => 100,
                'max_alerts' => -1, // illimité
                'description' => 'Great for growing teams',
                'is_active' => true,
            ],
            [
                'name' => 'Business',
                'price' => [
                    'monthly' => 99,     // Prix ajusté pour orgs illimitées
                    'yearly' => 1069     // 99 * 12 = 1188, avec -10% = 1069€
                ],
                'frequency' => 1, // minute (temps réel)
                'max_servers' => 50, // par organisation
                'max_users' => -1,   // membres illimités par organisation
                'max_organizations' => -1, // illimité
                'max_metrics' => -1, // illimité
                'max_alerts' => -1, // illimité
                'description' => 'Unlimited scale for large organizations',
                'is_active' => true,
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
