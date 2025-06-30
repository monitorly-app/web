<?php

namespace App\Http\Controllers;

use App\Mail\OrganizationInvitationEmail;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganizationInvitationController extends Controller
{
    /**
     * Créer une nouvelle invitation
     */
    public function store(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'organization_role_id' => 'required|exists:organization_roles,id',
        ]);

        // Vérifier que l'utilisateur n'est pas déjà membre
        $existingUser = User::where('email', $validated['email'])->first();
        if ($existingUser && $organization->hasMember($existingUser)) {
            return back()->withErrors(['email' => 'This user is already a member of this organization.']);
        }

        // Vérifier qu'il n'y a pas déjà une invitation en attente
        $existingInvitation = OrganizationInvitation::where('organization_id', $organization->id)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->first();

        if ($existingInvitation) {
            return back()->withErrors(['email' => 'An invitation has already been sent to this email address.']);
        }

        // Créer l'invitation
        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => $validated['email'],
            'organization_role_id' => $validated['organization_role_id'],
            'token' => Str::random(32),
            'status' => 'pending',
        ]);

        // Envoyer l'email d'invitation
        $invitation->load('role');
        Mail::to($validated['email'])->send(
            new OrganizationInvitationEmail($invitation, $organization, $request->user())
        );

        return back()->with('success', 'Invitation sent successfully!');
    }

    /**
     * Accepter une invitation
     */
    public function accept(Request $request, string $token)
    {
        $invitation = OrganizationInvitation::where('token', $token)
            ->where('status', 'pending')
            ->with(['organization', 'role'])
            ->first();

        if (!$invitation || $invitation->isExpired()) {
            return redirect()->route('login')
                ->with('error', 'This invitation is invalid or has expired.');
        }

        // Si l'utilisateur n'est pas connecté, le rediriger vers l'inscription/connexion
        if (!Auth::check()) {
            session(['invitation_token' => $token]);
            return redirect()->route('register')
                ->with('info', 'Please create an account or log in to accept this invitation.');
        }

        $user = Auth::user();

        // Vérifier que l'email correspond
        if ($user->email !== $invitation->email) {
            return redirect()->route('organizations.dashboard', $invitation->organization_id)
                ->with('error', 'This invitation was sent to a different email address.');
        }

        // Vérifier que l'utilisateur n'est pas déjà membre
        if ($invitation->organization->hasMember($user)) {
            $invitation->update(['status' => 'accepted']);
            return redirect()->route('organizations.dashboard', $invitation->organization_id)
                ->with('info', 'You are already a member of this organization.');
        }

        // Ajouter l'utilisateur à l'organisation
        $invitation->organization->members()->attach($user->id, [
            'organization_role_id' => $invitation->organization_role_id,
        ]);

        // Marquer l'invitation comme acceptée
        $invitation->update(['status' => 'accepted']);

        return redirect()->route('organizations.dashboard', $invitation->organization_id)
            ->with('success', "Welcome to {$invitation->organization->name}!");
    }

    /**
     * Supprimer une invitation
     */
    public function destroy(Request $request, Organization $organization, OrganizationInvitation $invitation)
    {
        // Vérifier que l'invitation appartient à cette organisation
        if ($invitation->organization_id !== $organization->id) {
            return back()->withErrors(['error' => 'Invalid invitation.']);
        }

        $invitation->delete();

        return back()->with('success', 'Invitation cancelled successfully!');
    }

    /**
     * Renvoyer une invitation
     */
    public function resend(Request $request, Organization $organization, OrganizationInvitation $invitation)
    {
        // Vérifier que l'invitation appartient à cette organisation
        if ($invitation->organization_id !== $organization->id) {
            return back()->withErrors(['error' => 'Invalid invitation.']);
        }

        // Vérifier que l'invitation est toujours valide
        if (!$invitation->isValid()) {
            return back()->withErrors(['error' => 'This invitation has expired or is no longer valid.']);
        }

        // Renvoyer l'email
        $invitation->load('role');
        Mail::to($invitation->email)->send(
            new OrganizationInvitationEmail($invitation, $organization, $request->user())
        );

        return back()->with('success', 'Invitation resent successfully!');
    }
}
