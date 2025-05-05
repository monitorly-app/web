<?php

namespace App\Http\Controllers;

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
        $stats = [
            'users_count' => User::count(),
            'active_users_count' => User::where('is_active', true)->count(),
            'roles_count' => Role::count(),
            'plans_count' => Plan::count(),
        ];

        $latestUsers = User::with(['role', 'plan'])
            ->latest()
            ->take(5)
            ->get();

        $usersByRole = Role::withCount('users')->get();
        $usersByPlan = Plan::withCount('users')->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'latestUsers' => $latestUsers,
            'usersByRole' => $usersByRole,
            'usersByPlan' => $usersByPlan,
        ]);
    }
}
