<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectMemberController extends Controller
{
    /**
     * Display a listing of the project members.
     */
    public function index(Project $project)
    {
        // Get the project with its owner and members
        $project->load('owner');
        $members = $project->members()->with('role')->get();

        return Inertia::render('User/Projects/Members/Index', [
            'project' => $project,
            'members' => $members,
        ]);
    }

    /**
     * Store a newly created member in the project.
     */
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'project_role_id' => 'required|exists:project_roles,id',
        ]);

        // Check if member already exists
        $exists = $project->members()->where('user_id', $validated['user_id'])->exists();
        if ($exists) {
            return redirect()->back()->with('error', 'This user is already a member of the project.');
        }

        // Add member to project
        $project->members()->attach($validated['user_id'], [
            'project_role_id' => $validated['project_role_id'],
        ]);

        return redirect()->back()->with('success', 'Member added successfully.');
    }

    /**
     * Update the specified member's role in the project.
     */
    public function update(Request $request, Project $project, User $user)
    {
        $validated = $request->validate([
            'project_role_id' => 'required|exists:project_roles,id',
        ]);

        // Check if member exists
        $exists = $project->members()->where('user_id', $user->id)->exists();
        if (!$exists) {
            return redirect()->back()->with('error', 'This user is not a member of the project.');
        }

        // Update member's role
        $project->members()->updateExistingPivot($user->id, [
            'project_role_id' => $validated['project_role_id'],
        ]);

        return redirect()->back()->with('success', 'Member role updated successfully.');
    }

    /**
     * Remove the specified member from the project.
     */
    public function destroy(Project $project, User $user)
    {
        // Prevent removing the owner
        if ($project->owner_id === $user->id) {
            return redirect()->back()->with('error', 'The project owner cannot be removed.');
        }

        // Remove member from project
        $project->members()->detach($user->id);

        return redirect()->back()->with('success', 'Member removed successfully.');
    }
}
