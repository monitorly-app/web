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

class OrganizationMembersController extends Controller
{
    /**
     * Afficher la liste des membres
     */
    public function index(Organization $organization)
    {
        $organization->load([
            'owner',
            'members' => function ($query) {
                $query->withPivot('organization_role_id');
            },
            'invitations' => function ($query) {
                $query->where('status', 'pending')
                    ->where('expires_at', '>', now())
                    ->with('role');
            }
        ]);

        // Charger les rôles pour chaque membre
        foreach ($organization->members as $member) {
            $member->organization_role = OrganizationRole::find($member->pivot->organization_role_id);
        }

        // Mapper les rôles des invitations pour correspondre à l'interface TypeScript
        foreach ($organization->invitations as $invitation) {
            $invitation->organization_role = $invitation->role;
        }

        $organizationRoles = OrganizationRole::all();

        $user = Auth::user();
        $permissions = [
            'canInviteMembers' => $organization->owner_id === $user->id ||
                $organization->members()->where('user_id', $user->id)->where('organization_role_id', 2)->exists(), // Admin can invite
            'canManageMembers' => $organization->owner_id === $user->id ||
                $organization->members()->where('user_id', $user->id)->where('organization_role_id', 2)->exists(), // Admin can manage
            'canRemoveMembers' => $organization->owner_id === $user->id, // Only owner can remove members
        ];

        return Inertia::render('User/Organizations/Members/Index', [
            'organization' => $organization,
            'organizationRoles' => $organizationRoles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Créer une nouvelle invitation
     */
    public function store(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'organization_role_id' => 'required|exists:organization_roles,id',
        ]);

        // Vérifier si l'utilisateur est déjà membre
        if (
            $organization->members()->where('email', $validated['email'])->exists() ||
            $organization->owner->email === $validated['email']
        ) {
            return back()->withErrors(['email' => 'This user is already a member of this organization.']);
        }

        // Vérifier s'il y a déjà une invitation en attente
        $existingInvitation = OrganizationInvitation::where('organization_id', $organization->id)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->valid()
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

        // Charger la relation role
        $invitation->load('role');
        Mail::to($validated['email'])->send(
            new OrganizationInvitationEmail($invitation, $organization, $request->user())
        );

        return back()->with('success', 'Invitation sent successfully.');
    }

    /**
     * Mettre à jour le rôle d'un membre
     */
    public function update(Request $request, Organization $organization, User $user)
    {
        $validated = $request->validate([
            'organization_role_id' => 'required|exists:organization_roles,id',
        ]);

        // Vérifier que l'utilisateur est membre de l'organisation
        $membership = $organization->members()->where('user_id', $user->id)->first();
        if (!$membership) {
            abort(404, 'User is not a member of this organization');
        }

        // Mettre à jour le rôle
        $organization->members()->updateExistingPivot($user->id, [
            'organization_role_id' => $validated['organization_role_id']
        ]);

        return back()->with('success', 'Member role updated successfully.');
    }

    /**
     * Supprimer un membre
     */
    public function destroy(Organization $organization, User $user)
    {
        // Vérifier que l'utilisateur est membre de l'organisation
        $membership = $organization->members()->where('user_id', $user->id)->first();
        if (!$membership) {
            abort(404, 'User is not a member of this organization');
        }

        // Supprimer le membre
        $organization->members()->detach($user->id);

        return back()->with('success', 'Member removed successfully.');
    }
}
