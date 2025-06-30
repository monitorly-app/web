<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function select(Request $request)
    {
        $user = $request->user();

        // Récupérer toutes les organisations avec leurs relations et statistiques
        $organizations = $user->ownedOrganizations()
            ->with(['plan', 'servers', 'members'])
            ->get()
            ->map(function ($organization) {
                // Calculer les statistiques enrichies
                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'description' => $organization->description,
                    'logo' => $organization->logo,
                    'owner_id' => $organization->owner_id,
                    'subscription_status' => $organization->subscription_status ?? 'active',

                    'plan' => $organization->plan ? [
                        'id' => $organization->plan->id,
                        'name' => $organization->plan->name,
                        'price' => $organization->plan->price,
                        'max_servers' => $organization->plan->max_servers,
                    ] : null,
                    'servers_count' => $organization->servers()->count(),
                    'members_count' => $organization->members()->count(),
                    'last_activity' => $organization->updated_at->format('c'),
                    'servers' => $organization->servers,
                    'members' => $organization->members,
                ];
            });

        // Si l'utilisateur n'a aucune organisation, le rediriger vers la création
        if ($organizations->isEmpty()) {
            return redirect()->route('organizations.create')
                ->with('info', 'Créez votre première organisation pour commencer.');
        }

        // Calculer les limites d'organisations
        $userPlan = $user->plan;
        $currentCount = $organizations->count();

        $organizationLimits = [
            'canCreate' => $this->canUserCreateOrganization($user, $userPlan, $currentCount)['allowed'],
            'currentCount' => $currentCount,
            'maxAllowed' => $this->getMaxOrganizationsForUserPlan($userPlan),
            'planName' => $userPlan?->name ?? 'Free',
        ];

        return Inertia::render('User/Organizations/Select', [
            'organizations' => $organizations,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'plan' => $userPlan ? [
                    'name' => $userPlan->name,
                    'max_organizations' => $userPlan->max_organizations ?? $this->getMaxOrganizationsForUserPlan($userPlan),
                ] : null,
            ],
            'organizationsCount' => $currentCount,
            'organizationLimits' => $organizationLimits,
        ]);
    }

    /**
     * Afficher le formulaire de création d'organisation
     */
    public function create(Request $request)
    {
        $user = $request->user();
        $userPlan = $user->plan;

        // Compter les organisations existantes
        $currentOrganizationsCount = $user->ownedOrganizations()->count();

        // Logique de limitation intelligente
        $canCreateOrganization = $this->canUserCreateOrganization($user, $userPlan, $currentOrganizationsCount);

        if (!$canCreateOrganization['allowed']) {
            return redirect()->route('organizations.select')
                ->with('error', $canCreateOrganization['message']);
        }

        $isFirstOrganization = $currentOrganizationsCount === 0;

        return Inertia::render('User/Organizations/Create', [
            'userPlan' => $userPlan,
            'isFirstOrganization' => $isFirstOrganization,
            'currentOrganizationsCount' => $currentOrganizationsCount,
            'organizationLimits' => $this->getOrganizationLimits($userPlan),
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut créer une nouvelle organisation
     */
    private function canUserCreateOrganization($user, $userPlan, $currentCount): array
    {
        // Vérifier les limites du plan utilisateur
        if (!$userPlan) {
            // Utilisateur sans plan = plan Free par défaut
            $userPlan = \App\Models\Plan::where('name', 'Free')->first();
        }

        $maxOrganizations = $this->getMaxOrganizationsForUserPlan($userPlan);

        if ($maxOrganizations !== -1 && $currentCount >= $maxOrganizations) {
            return [
                'allowed' => false,
                'message' => "Votre plan {$userPlan->name} vous limite à {$maxOrganizations} organisation(s). Mettez à niveau votre plan pour créer plus d'organisations."
            ];
        }

        return ['allowed' => true, 'message' => ''];
    }

    /**
     * Obtenir le nombre max d'organisations selon le plan utilisateur
     */
    private function getMaxOrganizationsForUserPlan($plan): int
    {
        return match ($plan->name) {
            'Free' => 1,      // Une seule organisation en gratuit
            'Pro' => 3,       // 3 organisations max en Pro
            'Business' => -1, // Illimité en Business
            default => 1,
        };
    }

    /**
     * Obtenir les limites par défaut pour une nouvelle organisation
     */
    private function getOrganizationLimits($userPlan): array
    {
        return [
            'default_plan' => 'Free', // Nouvelle orga commence en gratuit
            'requires_payment' => false,
        ];
    }

    /**
     * Créer une nouvelle organisation
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $userPlan = $user->plan;

        // Vérifier à nouveau les limites
        $currentOrganizationsCount = $user->ownedOrganizations()->count();
        $canCreate = $this->canUserCreateOrganization($user, $userPlan, $currentOrganizationsCount);

        if (!$canCreate['allowed']) {
            return back()->with('error', $canCreate['message']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'logo' => 'nullable|image|max:2048',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('organizations/logos', 'public');
        }

        // Déterminer le plan de l'organisation
        $organizationPlan = $this->determineOrganizationPlan($user, $currentOrganizationsCount);

        // Créer l'organisation avec son plan
        $organization = Organization::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'logo' => $logoPath,
            'owner_id' => $user->id,
            'plan_id' => $organizationPlan['plan_id'],
            'subscription_status' => $organizationPlan['status'],
        ]);

        return redirect()->route('organizations.dashboard', $organization->id)
            ->with('success', 'Organisation créée avec succès !');
    }

    /**
     * Déterminer le plan à assigner à la nouvelle organisation
     */
    private function determineOrganizationPlan($user, $currentCount): array
    {
        // L'organisation hérite du plan de l'utilisateur
        $userPlan = $user->plan;

        if (!$userPlan) {
            // Si l'utilisateur n'a pas de plan, utiliser le plan Free
            $freePlan = \App\Models\Plan::where('name', 'Free')->first();
            return [
                'plan_id' => $freePlan->id,
                'status' => 'active',
            ];
        }

        // L'organisation hérite du plan de l'utilisateur
        return [
            'plan_id' => $userPlan->id,
            'status' => 'active',
        ];
    }

    /**
     * Afficher la page de facturation d'une organisation
     */
    public function billing(Request $request, Organization $organization)
    {
        // Vérifier que l'utilisateur a accès à cette organisation
        if (!$organization->hasMember($request->user())) {
            abort(403, 'Accès non autorisé à cette organisation.');
        }

        // Charger les relations nécessaires
        $organization->load(['plan', 'servers', 'members']);

        // Enrichir l'organisation avec les données de facturation
        $organizationData = [
            'id' => $organization->id,
            'name' => $organization->name,
            'logo' => $organization->logo,
            'description' => $organization->description,
            'owner_id' => $organization->owner_id,
            'subscription_status' => $organization->subscription_status ?? 'active',
            'plan' => $organization->plan ? [
                'id' => $organization->plan->id,
                'name' => $organization->plan->name,
                'price' => $organization->plan->price,
                'billing_cycle' => 'an',
                'max_servers' => $organization->plan->max_servers,
                'max_members_per_organization' => $organization->plan->max_users,
            ] : null,
            'servers_count' => $organization->servers()->count(),
            'members_count' => $organization->members()->count(),
            'created_at' => $organization->created_at->format('c'),
            'updated_at' => $organization->updated_at->format('c'),
        ];

        return Inertia::render('User/Organizations/Billing', [
            'organization' => $organizationData,
        ]);
    }
}
