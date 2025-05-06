<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user() || !$request->user()->role) {
            return redirect()->route('login');
        }

        if ($role === 'admin') {
            // Si l'utilisateur n'est pas admin, accès interdit
            if (!$request->user()->isAdmin()) {
                abort(403, 'Unauthorized action.');
            }

            // Si l'admin est en mode personnel, rediriger vers le dashboard utilisateur
            if (Session::get('admin_mode', true) === false) {
                // Get last project or user dashboard
                $lastProject = $request->user()->projects()->latest()->first();
                if ($lastProject) {
                    return redirect()->route('projects.dashboard', $lastProject)
                        ->with('info', 'You are in personal account mode. Switch to admin mode to access admin features.');
                }

                return redirect()->route('projects.select')
                    ->with('info', 'You are in personal account mode. Switch to admin mode to access admin features.');
            }
        }

        // Pour les routes utilisateur, si l'utilisateur est un admin, vérifier s'il est en mode admin
        if ($role === 'user' && $request->user()->isAdmin() && Session::get('admin_mode', true) === true) {
            // L'admin est en mode admin mais essaie d'accéder à une route utilisateur
            // Rediriger vers le dashboard admin
            return redirect()->route('admin.dashboard')
                ->with('info', 'You are in admin mode. Switch to personal account to access user features.');
        }

        return $next($request);
    }
}
