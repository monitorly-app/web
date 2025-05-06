<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectDashboardController extends Controller
{
    /**
     * Display the project dashboard
     */
    public function index(Project $project)
    {
        // Load the project owner
        $project->load('owner');

        // Get the owner's plan to show limits
        $ownerPlan = $project->owner->plan;

        // Basic project statistics
        $stats = [
            'members_count' => $project->members()->count() + 1, // +1 for owner
            // Add other stats as needed
        ];

        return Inertia::render('User/Projects/Dashboard', [
            'project' => $project,
            'ownerPlan' => $ownerPlan, // Pass the owner's plan to the view if needed
            'stats' => $stats,
        ]);
    }
}
