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

        // Récupérer les organisations de l'utilisateur s'il est connecté
        $organizations = [];
        $currentOrganization = null;
        $organizationLimits = null;

        if ($request->user()) {
            // Récupérer les organisations via les relations directes
            $userOrganizations = $request->user()->ownedOrganizations()->with('owner')->get()
                ->merge($request->user()->memberOrganizations()->with('owner')->get())
                ->unique('id');

            $organizations = $userOrganizations->map(function ($organization) use ($request) {
                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'logo' => $organization->logo,
                    'owner_id' => $organization->owner_id,
                    'is_owner' => $organization->owner_id === $request->user()->id,
                ];
            });

            // Try to determine current organization from route
            $routeOrganization = $request->route('organization');
            if ($routeOrganization) {
                // If it's a string (ID), find the organization in our collection
                if (is_string($routeOrganization)) {
                    $currentOrganization = $userOrganizations->where('id', $routeOrganization)->first();
                } else {
                    // If it's already an object, use it directly
                    $currentOrganization = $routeOrganization;
                }
            } else {
                // Get from session or use the latest organization
                $sessionOrganization = $userOrganizations->where('id', session('last_organization_id'))->first();
                $currentOrganization = $sessionOrganization ?: $userOrganizations->sortByDesc('created_at')->first();
            }

            if ($currentOrganization) {
                // Charger les membres avec leurs rôles pour les permissions
                $currentOrganization->load(['members' => function ($query) {
                    $query->withPivot('organization_role_id');
                }]);

                $currentOrganization = [
                    'id' => $currentOrganization->id,
                    'name' => $currentOrganization->name,
                    'logo' => $currentOrganization->logo,
                    'owner_id' => $currentOrganization->owner_id,
                    'is_owner' => $currentOrganization->owner_id === $request->user()->id,
                    'members' => $currentOrganization->members->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'email' => $member->email,
                            'pivot' => [
                                'organization_role_id' => $member->pivot->organization_role_id,
                            ],
                        ];
                    }),
                ];
            }

            // Calculer les limites d'organisation (seulement les organisations possédées)
            $ownedOrganizationsCount = $request->user()->ownedOrganizations()->count();
            $organizationLimits = $this->calculateOrganizationLimits($request->user(), $ownedOrganizationsCount);
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'admin_mode' => session('admin_mode', true),
            'organizations' => $organizations,
            'currentOrganization' => $currentOrganization,
            'organizationLimits' => $organizationLimits,
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

    /**
     * Calculer les limites d'organisation pour l'utilisateur
     */
    private function calculateOrganizationLimits($user, $currentCount): array
    {
        if (!$user) {
            return [
                'canCreate' => false,
                'currentCount' => 0,
                'maxAllowed' => 0,
                'planName' => 'None',
            ];
        }

        $userPlan = $user->plan;
        $planName = $userPlan?->name ?? 'Free';

        $maxOrganizations = match ($planName) {
            'Free' => 1,
            'Pro' => 3,
            'Business' => -1,
            default => 1,
        };

        // Si c'est la première organisation, toujours autorisé
        $canCreate = $currentCount === 0;

        // Sinon, vérifier les limites du plan
        if ($currentCount > 0) {
            $canCreate = $userPlan && ($maxOrganizations === -1 || $currentCount < $maxOrganizations);
        }

        return [
            'canCreate' => $canCreate,
            'currentCount' => $currentCount,
            'maxAllowed' => $maxOrganizations,
            'planName' => $planName,
        ];
    }
}
