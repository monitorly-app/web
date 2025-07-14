<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationRole;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Server;
use App\Models\User;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function index()
    {
        // Get the stats
        $stats = [
            'users_count' => User::count(),
            'organizations_count' => Organization::count(),
            'servers_count' => Server::count(),
            'plans_count' => Plan::count(),
            'active_users_count' => User::where('is_active', true)->count(),
            'roles_count' => Role::count(),
            'organization_roles_count' => OrganizationRole::count(),
        ];

        // Get the latest users
        $latestUsers = User::with(['role'])
            ->latest()
            ->take(5)
            ->get();

        // Get the users by role
        $usersByRole = Role::withCount('users')->get();

        // Get the organizations by plan
        $organizationsByPlan = Plan::withCount('organizations')->get();

        // Get organization roles with member counts
        $organizationRoles = OrganizationRole::withCount(['users as members_count'])
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'members_count' => $role->members_count,
                    'is_system' => $role->isSystemRole(),
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'latestUsers' => $latestUsers,
            'usersByRole' => $usersByRole,
            'organizationsByPlan' => $organizationsByPlan,
            'organizationRoles' => $organizationRoles,
        ]);
    }
}
