<?php

namespace App\Http\Controllers;

use App\Mail\ProjectInvitationEmail;
use App\Models\Project;
use App\Models\ProjectInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
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

        // Load relations for email
        $invitation->load('role');

        try {
            // Send invitation email
            Mail::to($validated['email'])->send(
                new ProjectInvitationEmail($invitation, $project, Auth::user())
            );

            return redirect()->back()->with('success', 'Invitation sent successfully.');
        } catch (\Exception $e) {
            // Delete invitation if email fails
            $invitation->delete();

            return redirect()->back()->with('error', 'Failed to send invitation email.');
        }
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

        return redirect()->back()->with('success', 'Invitation cancelled successfully.');
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

        // Load relations for email
        $invitation->load('role');

        try {
            // Send invitation email
            Mail::to($invitation->email)->send(
                new ProjectInvitationEmail($invitation, $project, Auth::user())
            );

            return redirect()->back()->with('success', 'Invitation resent successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to resend invitation email.');
        }
    }

    /**
     * Accept the invitation.
     */
    public function accept(Request $request, string $token)
    {
        $invitation = ProjectInvitation::where('token', $token)
            ->where('status', 'pending')
            ->with(['project', 'role'])
            ->first();

        if (!$invitation) {
            return redirect()->route('home')->with('error', 'This invitation is invalid or has already been used.');
        }

        // Check if invitation has expired (7 days)
        if ($invitation->created_at->addDays(7)->isPast()) {
            $invitation->update(['status' => 'expired']);
            return redirect()->route('home')->with('error', 'This invitation has expired. Please request a new one.');
        }

        // Check if user is authenticated
        if (!$request->user()) {
            // Store invitation token in session and redirect to login/register
            session(['invitation_token' => $token]);
            return redirect()->route('register')->with('info', 'Please register or login to accept the invitation.');
        }

        // Check if email matches
        if ($invitation->email !== $request->user()->email) {
            return redirect()->route('home')->with('error', 'This invitation was sent to a different email address (' . $invitation->email . ').');
        }

        // Check if user is already a member of the project
        if ($invitation->project->members()->where('user_id', $request->user()->id)->exists()) {
            $invitation->update(['status' => 'accepted']);
            return redirect()->route('projects.dashboard', $invitation->project_id)
                ->with('info', 'You are already a member of this project.');
        }

        // Check if user is the project owner
        if ($invitation->project->owner_id === $request->user()->id) {
            $invitation->update(['status' => 'accepted']);
            return redirect()->route('projects.dashboard', $invitation->project_id)
                ->with('info', 'You are the owner of this project.');
        }

        try {
            // Add user to project
            $invitation->project->members()->attach($request->user()->id, [
                'project_role_id' => $invitation->project_role_id,
            ]);

            // Mark invitation as accepted
            $invitation->update(['status' => 'accepted']);

            return redirect()->route('projects.dashboard', $invitation->project_id)
                ->with('success', 'You have successfully joined the project "' . $invitation->project->name . '".');
        } catch (\Exception $e) {
            return redirect()->route('home')->with('error', 'An error occurred while joining the project. Please try again.');
        }
    }
}
