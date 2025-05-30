<?php

namespace Database\Seeders;

use App\Models\ProjectRole;
use Illuminate\Database\Seeder;

class ProjectRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Owner',
                'description' => 'Project owner with full access - can manage everything including project deletion',
            ],
            [
                'name' => 'Admin',
                'description' => 'Project administrator - full access except project deletion and ownership transfer',
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
            ProjectRole::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
