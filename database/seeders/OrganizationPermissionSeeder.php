<?php

namespace Database\Seeders;

use App\Models\OrganizationPermission;
use App\Models\OrganizationRole;
use Illuminate\Database\Seeder;

class OrganizationPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Gestion des serveurs
            [
                'name' => 'view_servers',
                'label' => 'View Servers',
                'description' => 'Can view servers and their basic information',
                'category' => 'servers',
                'is_system' => true,
            ],
            [
                'name' => 'create_servers',
                'label' => 'Create Servers',
                'description' => 'Can add new servers to the organization',
                'category' => 'servers',
                'is_system' => true,
            ],
            [
                'name' => 'edit_servers',
                'label' => 'Edit Servers',
                'description' => 'Can modify server configurations and settings',
                'category' => 'servers',
                'is_system' => true,
            ],
            [
                'name' => 'delete_servers',
                'label' => 'Delete Servers',
                'description' => 'Can remove servers from the organization',
                'category' => 'servers',
                'is_system' => true,
            ],

            // Gestion des métriques
            [
                'name' => 'view_metrics',
                'label' => 'View Metrics',
                'description' => 'Can view server metrics and monitoring data',
                'category' => 'metrics',
                'is_system' => true,
            ],
            [
                'name' => 'configure_alerts',
                'label' => 'Configure Alerts',
                'description' => 'Can create and modify alert rules',
                'category' => 'metrics',
                'is_system' => true,
            ],
            [
                'name' => 'acknowledge_alerts',
                'label' => 'Acknowledge Alerts',
                'description' => 'Can acknowledge and resolve alerts',
                'category' => 'metrics',
                'is_system' => true,
            ],

            // Gestion des membres
            [
                'name' => 'view_members',
                'label' => 'View Members',
                'description' => 'Can view organization members and their roles',
                'category' => 'members',
                'is_system' => true,
            ],
            [
                'name' => 'invite_members',
                'label' => 'Invite Members',
                'description' => 'Can send invitations to new members',
                'category' => 'members',
                'is_system' => true,
            ],
            [
                'name' => 'manage_members',
                'label' => 'Manage Members',
                'description' => 'Can modify member roles and permissions',
                'category' => 'members',
                'is_system' => true,
            ],
            [
                'name' => 'remove_members',
                'label' => 'Remove Members',
                'description' => 'Can remove members from the organization',
                'category' => 'members',
                'is_system' => true,
            ],

            // Gestion des paramètres
            [
                'name' => 'view_settings',
                'label' => 'View Settings',
                'description' => 'Can view organization settings',
                'category' => 'settings',
                'is_system' => true,
            ],
            [
                'name' => 'manage_settings',
                'label' => 'Manage Settings',
                'description' => 'Can modify organization settings and configuration',
                'category' => 'settings',
                'is_system' => true,
            ],
            [
                'name' => 'manage_api_keys',
                'label' => 'Manage API Keys',
                'description' => 'Can generate and manage API keys',
                'category' => 'settings',
                'is_system' => true,
            ],
            [
                'name' => 'delete_organization',
                'label' => 'Delete Organization',
                'description' => 'Can permanently delete the organization',
                'category' => 'settings',
                'is_system' => true,
            ],

            // Facturation
            [
                'name' => 'view_billing',
                'label' => 'View Billing',
                'description' => 'Can view billing information and invoices',
                'category' => 'billing',
                'is_system' => true,
            ],
            [
                'name' => 'manage_billing',
                'label' => 'Manage Billing',
                'description' => 'Can manage billing and subscription settings',
                'category' => 'billing',
                'is_system' => true,
            ],
        ];

        // Créer les permissions
        foreach ($permissions as $permission) {
            OrganizationPermission::updateOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Assigner les permissions par défaut aux rôles
        $this->assignDefaultPermissions();
    }

    /**
     * Assigner les permissions par défaut aux rôles existants
     */
    private function assignDefaultPermissions(): void
    {
        $roles = [
            'Owner' => [
                'view_servers',
                'create_servers',
                'edit_servers',
                'delete_servers',
                'view_metrics',
                'configure_alerts',
                'acknowledge_alerts',
                'view_members',
                'invite_members',
                'manage_members',
                'remove_members',
                'view_settings',
                'manage_settings',
                'manage_api_keys',
                'delete_organization',
                'view_billing',
                'manage_billing',
            ],
            'Admin' => [
                'view_servers',
                'create_servers',
                'edit_servers',
                'delete_servers',
                'view_metrics',
                'configure_alerts',
                'acknowledge_alerts',
                'view_members',
                'invite_members',
                'manage_members',
                'remove_members',
                'view_settings',
                'manage_settings',
                'manage_api_keys',
                'view_billing',
            ],
            'Engineer' => [
                'view_servers',
                'create_servers',
                'edit_servers',
                'view_metrics',
                'configure_alerts',
                'acknowledge_alerts',
                'view_members',
            ],
            'Developer' => [
                'view_servers',
                'view_metrics',
                'acknowledge_alerts',
                'view_members',
            ],
            'Viewer' => [
                'view_servers',
                'view_metrics',
                'view_members',
            ],
        ];

        foreach ($roles as $roleName => $permissionNames) {
            $role = OrganizationRole::where('name', $roleName)->first();
            if ($role) {
                $permissions = OrganizationPermission::whereIn('name', $permissionNames)->pluck('id');
                $role->permissions()->sync($permissions);
            }
        }
    }
}
