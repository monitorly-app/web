<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Role;
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
            'active_users_count' => User::where('is_active', true)->count(),
            'roles_count' => Role::count(),
            'plans_count' => Plan::count(),
        ];

        // Get the latest users
        $latestUsers = User::with(['role', 'plan'])
            ->latest()
            ->take(5)
            ->get();

        // Get the users by role
        $usersByRole = Role::withCount('users')->get();

        // Get the users by plan
        $usersByPlan = Plan::withCount('users')->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'latestUsers' => $latestUsers,
            'usersByRole' => $usersByRole,
            'usersByPlan' => $usersByPlan,
        ]);
    }
}
