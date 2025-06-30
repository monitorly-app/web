<?php

namespace Database\Seeders;

use App\Models\OrganizationRole;
use Illuminate\Database\Seeder;

class OrganizationRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Owner',
                'description' => 'Organization owner with full access - can manage everything including organization deletion',
            ],
            [
                'name' => 'Admin',
                'description' => 'Organization administrator - full access except organization deletion and ownership transfer',
            ],
            [
                'name' => 'Engineer',
                'description' => 'Can manage servers, configure alerts, view all metrics - cannot manage members',
            ],
            [
                'name' => 'Developer',
                'description' => 'Can view servers and metrics, acknowledge alerts - cannot modify configurations',
            ],
            [
                'name' => 'Viewer',
                'description' => 'Read-only access to servers, metrics and alerts - cannot modify anything',
            ],
        ];

        foreach ($roles as $role) {
            OrganizationRole::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
