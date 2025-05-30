<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Récupérer les projets de l'utilisateur s'il est connecté
        $projects = [];
        $currentProject = null;

        if ($request->user()) {
            $projects = $request->user()->projects()
                ->select('id', 'name', 'owner_id')
                ->get();

            // Si un projet est actif dans la requête
            if ($request->route('project')) {
                $currentProject = $request->route('project');

                // Charger les membres avec leurs rôles pour les permissions
                $currentProject->load(['members' => function ($query) {
                    $query->select('users.id', 'users.name', 'users.email')
                        ->withPivot('project_role_id');
                }]);
            }
            // Sinon, récupérer le dernier projet utilisé
            else if (session()->has('last_project_id')) {
                $lastProjectId = session('last_project_id');
                $currentProject = $request->user()->projects()
                    ->where('id', $lastProjectId)
                    ->with(['members' => function ($query) {
                        $query->select('users.id', 'users.name', 'users.email')
                            ->withPivot('project_role_id');
                    }])
                    ->first();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'admin_mode' => session('admin_mode', true),
            'projects' => $projects,
            'currentProject' => $currentProject,
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
            ],
        ];
    }
}
