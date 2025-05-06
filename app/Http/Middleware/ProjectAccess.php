<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProjectAccess
{
    /**
     * Vérifie si l'utilisateur a accès au projet spécifié dans la route.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $projectId = $request->route('project');
        $user = $request->user();

        // Si le paramètre project n'est pas dans la route, on continue
        if (!$projectId) {
            return $next($request);
        }

        // Récupérer le projet
        $project = Project::findOrFail($projectId);

        // Vérifier si l'utilisateur est membre du projet
        $isMember = $project->members()->where('user_id', $user->id)->exists();

        if (!$isMember && $project->owner_id !== $user->id) {
            abort(403, "You don't have access to this project");
        }

        // Sauvegarder le projet actuel en session
        session(['last_project_id' => $project->id]);

        // Ajouter le projet à la requête pour y accéder dans les contrôleurs
        $request->merge(['currentProject' => $project]);

        return $next($request);
    }
}
