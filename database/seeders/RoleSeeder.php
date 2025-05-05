<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Admin',
                'description' => 'Administrator with full access',
            ],
            [
                'name' => 'User',
                'description' => 'Regular user with limited access',
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
