<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ProjectOwner
{
    /**
     * Vérifie si l'utilisateur est propriétaire du projet.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $project = $request->route('project');
        $user = $request->user();


        // Si le paramètre project n'est pas dans la route, on continue
        if (!$project) {
            return $next($request);
        }

        // Récupérer le projet
        // $project = Project::findOrFail($projectId);

        // Vérifier si l'utilisateur est propriétaire du projet
        if ($project->owner_id !== $user->id) {
            // Vérifier si l'utilisateur a un rôle d'administrateur dans le projet
            $isProjectAdmin = $project->members()
                ->where('user_id', $user->id)
                ->where('project_role_id', 1) // Assuming 1 is the admin role
                ->exists();

            if (!$isProjectAdmin) {
                abort(403, "You must be the owner or an admin of this project");
            }
        }

        return $next($request);
    }
}
