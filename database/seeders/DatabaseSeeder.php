<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PlanSeeder::class,
        ]);

        // Create admin user
        User::create([
            'name' => 'Admin User',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role_id' => 1, // Admin role
            'plan_id' => 3, // Business plan
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Create regular user
        User::create([
            'name' => 'Regular User',
            'first_name' => 'Regular',
            'last_name' => 'User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'role_id' => 2, // User role
            'plan_id' => 1, // Free plan
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
    }
}
