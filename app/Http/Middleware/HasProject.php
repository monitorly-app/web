<?php

use Illuminate\Http\Request;

class HasProject
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Vérifie si l'utilisateur a au moins un projet
        if ($user->projects()->count() === 0) {
            // Si l'utilisateur n'a aucun projet et n'est pas sur la page de création
            if (!$request->routeIs('projects.create') && !$request->routeIs('projects.store')) {
                return redirect()->route('projects.create');
            }
        }

        return $next($request);
    }
}
