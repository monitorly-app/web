<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class AdminAccountController extends Controller
{
    /**
     * Switch between admin and personal accounts.
     */
    public function switchAccount(Request $request)
    {
        $user = $request->user();

        // Check if user is an admin
        if ($user->role_id !== 1) {
            return redirect()->back()->with('error', 'You do not have permission to switch accounts.');
        }

        // Toggle admin_mode
        $currentMode = Session::get('admin_mode', true);
        Session::put('admin_mode', !$currentMode);

        // Redirect to appropriate dashboard
        if ($currentMode) {
            // Was in admin mode, now switching to personal
            // Check if user has any projects
            $lastProject = $user->projects()->latest()->first();

            if ($lastProject) {
                // Redirect to the project dashboard if a project exists
                return redirect()->route('projects.dashboard', $lastProject)
                    ->with('success', 'Switched to personal account');
            } else {
                // If no projects exist, redirect to create project page
                return redirect()->route('projects.create')
                    ->with('success', 'Switched to personal account. Create your first project to get started.');
            }
        } else {
            // Was in personal mode, now switching to admin
            return redirect()->route('admin.dashboard')
                ->with('success', 'Switched to admin account');
        }
    }
}
