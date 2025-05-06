<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoadCurrentProject
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->route('project')) {
            // Charger le projet depuis l'UUID dans la route
            $project = Project::findOrFail($request->route('project'));

            // Vérifier si l'utilisateur a accès à ce projet
            if (!$project->members->contains($request->user())) {
                abort(403, 'You do not have access to this project');
            }

            // Ajouter le projet à la requête pour y accéder dans les contrôleurs
            $request->merge(['currentProject' => $project]);

            // Partager le projet avec la vue
            Inertia::share('currentProject', $project);
        }

        return $next($request);
    }
}
