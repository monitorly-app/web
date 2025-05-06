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
                'description' => 'Project owner with full access',
            ],
            [
                'name' => 'Admin',
                'description' => 'Project administrator with most privileges',
            ],
            [
                'name' => 'Developer',
                'description' => 'Can manage servers and view metrics',
            ],
            [
                'name' => 'Viewer',
                'description' => 'Read-only access to project resources',
            ],
        ];

        foreach ($roles as $role) {
            ProjectRole::create($role);
        }
    }
}
