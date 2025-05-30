<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectRole;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectDashboardController extends Controller
{
    /**
     * Display the project dashboard
     */
    public function index(Project $project)
    {
        // Load the project with its owner and members
        $project->load(['owner', 'members']);

        // Get project roles for display
        $projectRoles = ProjectRole::all();

        // Determine if user is owner
        $isOwner = $project->owner_id === Auth::id();

        // Basic project statistics
        $stats = [
            'members_count' => $project->members()->count() + 1, // +1 for owner
            // Add other stats as needed
        ];

        // On change juste la vue ici: User/Projects/Overview au lieu de Dashboard!
        return Inertia::render('User/Projects/Overview', [
            'project' => $project,
            'isOwner' => $isOwner,
            'projectRoles' => $projectRoles,
            'stats' => $stats,
        ]);
    }
}
