<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectInvitationController extends Controller
{
    /**
     * Store a newly created invitation.
     */
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'project_role_id' => 'required|exists:project_roles,id',
        ]);

        // Check if invitation already exists
        $exists = ProjectInvitation::where('project_id', $project->id)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->exists();
        if ($exists) {
            return redirect()->back()->with('error', 'An invitation has already been sent to this email.');
        }

        // Create invitation
        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'email' => $validated['email'],
            'project_role_id' => $validated['project_role_id'],
            'token' => Str::uuid(),
            'status' => 'pending',
        ]);

        // Send invitation email
        // TODO: Implement email sending

        return redirect()->back()->with('success', 'Invitation sent successfully.');
    }

    /**
     * Remove the specified invitation.
     */
    public function destroy(Project $project, ProjectInvitation $invitation)
    {
        // Check if invitation belongs to the project
        if ($invitation->project_id !== $project->id) {
            return redirect()->back()->with('error', 'This invitation does not belong to the project.');
        }

        $invitation->delete();

        return redirect()->back()->with('success', 'Invitation deleted successfully.');
    }

    /**
     * Resend the invitation.
     */
    public function resend(Project $project, ProjectInvitation $invitation)
    {
        // Check if invitation belongs to the project
        if ($invitation->project_id !== $project->id) {
            return redirect()->back()->with('error', 'This invitation does not belong to the project.');
        }

        // Update invitation token
        $invitation->update([
            'token' => Str::uuid(),
        ]);

        // Send invitation email
        // TODO: Implement email sending

        return redirect()->back()->with('success', 'Invitation resent successfully.');
    }

    /**
     * Accept the invitation.
     */
    public function accept(Request $request, string $token)
    {
        $invitation = ProjectInvitation::where('token', $token)
            ->where('status', 'pending')
            ->firstOrFail();

        // Check if user is authenticated
        if (!$request->user()) {
            // Store invitation token in session and redirect to login/register
            session(['invitation_token' => $token]);
            return redirect()->route('register')->with('info', 'Please register or login to accept the invitation.');
        }

        // Check if email matches
        if ($invitation->email !== $request->user()->email) {
            return redirect()->route('home')->with('error', 'This invitation was sent to a different email address.');
        }

        // Add user to project
        $invitation->project->members()->attach($request->user()->id, [
            'project_role_id' => $invitation->project_role_id,
        ]);

        // Mark invitation as accepted
        $invitation->update([
            'status' => 'accepted',
        ]);

        return redirect()->route('projects.dashboard', $invitation->project_id)
            ->with('success', 'You have successfully joined the project.');
    }
}
