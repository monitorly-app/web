<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class OrganizationOwner
{
    /**
     * Vérifie si l'utilisateur est propriétaire de l'organisation.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $organization = $request->route('organization');
        $user = $request->user();

        // Si le paramètre organization n'est pas dans la route, on continue
        if (!$organization) {
            return $next($request);
        }

        // Vérifier si l'utilisateur est propriétaire de l'organisation
        if ($organization->owner_id !== $user->id) {
            // Vérifier si l'utilisateur a un rôle d'administrateur dans l'organisation
            // ID 2 = Admin selon OrganizationRoleSeeder
            $isOrganizationAdmin = $organization->members()
                ->where('user_id', $user->id)
                ->where('organization_role_id', 2) // Admin role ID
                ->exists();

            if (!$isOrganizationAdmin) {
                abort(403, "Only organization owners and admins can access settings");
            }
        }

        return $next($request);
    }
}
