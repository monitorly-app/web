<?php

namespace App\Http\Controllers;

use App\Mail\ProjectInvitationEmail;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\ProjectRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectMembersController extends Controller
{
    /**
     * Affiche la page de gestion des membres du projet
     */
    public function index(Project $project)
    {
        // Charger le projet avec son propriétaire et ses membres
        $project->load(['owner', 'members']);

        // Récupérer les invitations en attente pour ce projet
        $pendingInvitations = ProjectInvitation::where('project_id', $project->id)
            ->where('status', 'pending')
            ->with('role') // Charger le rôle de l'invitation
            ->get();

        // Récupérer les rôles disponibles pour les membres
        $projectRoles = ProjectRole::all();

        // Déterminer si l'utilisateur est propriétaire
        $isOwner = $project->owner_id === Auth::id();

        return Inertia::render('User/Projects/Members/Index', [
            'project' => $project,
            'isOwner' => $isOwner,
            'projectRoles' => $projectRoles,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }

    /**
     * Ajoute un membre au projet
     */
    public function store(Request $request, Project $project)
    {
        // Vérifier que l'utilisateur actuel est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only project owners can add members.');
        }

        // Valider la requête
        $validated = $request->validate([
            'email' => 'required|email',
            'project_role_id' => 'required|exists:project_roles,id',
        ]);

        // Vérifier que l'utilisateur ne s'invite pas lui-même
        if ($validated['email'] === Auth::user()->email) {
            return redirect()->back()->with('error', 'You cannot invite yourself to the project.');
        }

        // Vérifier si l'utilisateur existe déjà
        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            // Vérifier si l'utilisateur est déjà membre du projet
            if ($project->members()->where('user_id', $user->id)->exists()) {
                return redirect()->back()->with('error', 'This user is already a member of this project.');
            }

            // Ajouter directement l'utilisateur comme membre du projet
            $project->members()->attach($user->id, [
                'project_role_id' => $validated['project_role_id'],
            ]);

            return redirect()->back()->with('success', 'User added to the project successfully.');
        }

        // L'utilisateur n'existe pas, créer une invitation

        // Vérifier si une invitation existe déjà pour cet email
        $existingInvitation = ProjectInvitation::where('project_id', $project->id)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->exists();

        if ($existingInvitation) {
            return redirect()->back()->with('error', 'An invitation has already been sent to this email address.');
        }

        // Créer l'invitation
        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'email' => $validated['email'],
            'project_role_id' => $validated['project_role_id'],
            'token' => Str::uuid(),
            'status' => 'pending',
        ]);

        // Charger les relations nécessaires pour l'email
        $invitation->load('role');

        try {
            // Envoyer l'email d'invitation
            Mail::to($validated['email'])->send(
                new ProjectInvitationEmail($invitation, $project, Auth::user())
            );

            return redirect()->back()->with('success', 'Invitation sent successfully to ' . $validated['email']);
        } catch (\Exception $e) {
            // Supprimer l'invitation si l'envoi de l'email échoue
            $invitation->delete();

            return redirect()->back()->with('error', 'Failed to send invitation email. Please try again.');
        }
    }

    /**
     * Met à jour le rôle d'un membre du projet
     */
    public function update(Request $request, Project $project, User $user)
    {
        // Vérifier que l'utilisateur actuel est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only project owners can change member roles.');
        }

        // Vérifier que l'utilisateur est membre du projet
        if (!$project->members()->where('user_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'User is not a member of this project.');
        }

        // Valider la requête
        $validated = $request->validate([
            'project_role_id' => 'required|exists:project_roles,id',
        ]);

        // Mettre à jour le rôle du membre
        $project->members()->updateExistingPivot($user->id, [
            'project_role_id' => $validated['project_role_id'],
        ]);

        return redirect()->back()->with('success', 'Member role updated successfully.');
    }

    /**
     * Retire un membre du projet
     */
    public function destroy(Project $project, User $user)
    {
        // Vérifier que l'utilisateur actuel est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only project owners can remove members.');
        }

        // On ne peut pas retirer le propriétaire
        if ($project->owner_id === $user->id) {
            return redirect()->back()->with('error', 'Cannot remove the project owner.');
        }

        // Vérifier que l'utilisateur est bien membre du projet
        if (!$project->members()->where('user_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'User is not a member of this project.');
        }

        // Retirer le membre
        $project->members()->detach($user->id);

        return redirect()->back()->with('success', 'Member removed successfully.');
    }
}
