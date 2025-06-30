<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\OrganizationRole;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationDashboardController extends Controller
{
    /**
     * Display the organization dashboard
     */
    public function index(Request $request, Organization $organization)
    {
        // Charger les relations nécessaires
        $organization->load([
            'owner',
            'members' => function ($query) {
                $query->withPivot('organization_role_id');
            },
            'servers',
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

        // Récupérer les rôles d'organisation
        $organizationRoles = OrganizationRole::all();

        // Vérifier si l'utilisateur est propriétaire
        $isOwner = $organization->owner_id === $request->user()->id;

        // Obtenir les statistiques
        $stats = $organization->getOrganizationStats();

        // On change juste la vue ici: User/Organizations/Overview au lieu de Dashboard!
        return Inertia::render('User/Organizations/Overview', [
            'organization' => $organization,
            'isOwner' => $isOwner,
            'organizationRoles' => $organizationRoles,
            'stats' => $stats,
        ]);
    }
}
