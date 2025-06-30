<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HasOrganization
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Vérifie si l'utilisateur a au moins une organisation
        if ($user->ownedOrganizations()->count() === 0) {
            // Si l'utilisateur n'a aucune organisation et n'est pas sur la page de création
            if (!$request->routeIs('organizations.create') && !$request->routeIs('organizations.store')) {
                return redirect()->route('organizations.create');
            }
        }

        return $next($request);
    }
}
