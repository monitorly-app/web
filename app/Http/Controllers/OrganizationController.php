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
        $currentCount = $organizations->count();

        // Nouvelle logique basée sur les organisations
        $canCreateResult = $this->canUserCreateOrganization($user, $currentCount);

        $organizationLimits = [
            'canCreate' => $canCreateResult['allowed'],
            'currentCount' => $currentCount,
            'maxAllowed' => $canCreateResult['maxAllowed'],
            'planName' => $canCreateResult['planName'],
        ];

        return Inertia::render('User/Organizations/Select', [
            'organizations' => $organizations,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
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

        // Compter les organisations existantes
        $currentOrganizationsCount = $user->ownedOrganizations()->count();

        // Logique de limitation intelligente
        $canCreateOrganization = $this->canUserCreateOrganization($user, $currentOrganizationsCount);

        if (!$canCreateOrganization['allowed']) {
            return redirect()->route('organizations.select')
                ->with('error', $canCreateOrganization['message']);
        }

        $isFirstOrganization = $currentOrganizationsCount === 0;

        // Récupérer tous les plans actifs
        $plans = \App\Models\Plan::where('is_active', true)
            ->orderBy('price->monthly')
            ->get();

        return Inertia::render('User/Organizations/Create/Index', [
            'plans' => $plans,
            'isFirstOrganization' => $isFirstOrganization,
            'currentOrganizationsCount' => $currentOrganizationsCount,
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut créer une nouvelle organisation
     */
    private function canUserCreateOrganization($user, $currentCount): array
    {
        // Compter les organisations gratuites de l'utilisateur
        $freeOrgsCount = $user->ownedOrganizations()
            ->whereHas('plan', function ($q) {
                $q->where('name', 'Free');
            })
            ->count();

        // Vérifier s'il a une organisation payante
        $hasProOrg = $user->ownedOrganizations()
            ->whereHas('plan', function ($q) {
                $q->where('name', '!=', 'Free');
            })
            ->exists();

        // Règles : Max 3 orgs gratuites par user, mais si il a une org Pro+ alors illimité
        $maxFreeOrgs = 3;

        if ($hasProOrg) {
            // Utilisateur avec org Pro+ = illimité
            return [
                'allowed' => true,
                'message' => '',
                'maxAllowed' => -1,
                'planName' => 'Pro+'
            ];
        } else if ($freeOrgsCount < $maxFreeOrgs) {
            // Utilisateur peut encore créer des orgs gratuites
            return [
                'allowed' => true,
                'message' => '',
                'maxAllowed' => $maxFreeOrgs,
                'planName' => 'Free'
            ];
        } else {
            // Limite atteinte
            return [
                'allowed' => false,
                'message' => "Vous avez atteint la limite de {$maxFreeOrgs} organisations gratuites. Mettez à niveau une organisation vers un plan Pro pour créer plus d'organisations.",
                'maxAllowed' => $maxFreeOrgs,
                'planName' => 'Free'
            ];
        }
    }



    /**
     * Créer une nouvelle organisation
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Vérifier à nouveau les limites
        $currentOrganizationsCount = $user->ownedOrganizations()->count();
        $canCreate = $this->canUserCreateOrganization($user, $currentOrganizationsCount);

        if (!$canCreate['allowed']) {
            return back()->with('error', $canCreate['message']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'plan_id' => 'required|exists:plans,id',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'organization_type' => 'required|in:company,individual',
            'billing_period' => 'required|in:monthly,yearly',
            'billing_address' => 'nullable|array',
            'billing_address.street' => 'nullable|string|max:255',
            'billing_address.street_line_2' => 'nullable|string|max:255',
            'billing_address.city' => 'nullable|string|max:100',
            'billing_address.state' => 'nullable|string|max:100',
            'billing_address.postal_code' => 'nullable|string|max:20',
            'billing_address.country' => 'nullable|string|max:10',
            'billing_address.formatted' => 'nullable|string|max:500',
            'tax_number' => 'nullable|string|max:50',
        ]);

        $plan = \App\Models\Plan::findOrFail($validated['plan_id']);

        // Gérer l'upload du logo
        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('organizations/logos', 'public');
        }

        // Créer l'organisation avec le plan sélectionné
        $organization = \App\Models\Organization::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'name' => $validated['name'],
            'description' => $validated['description'],
            'logo' => $logoPath,
            'owner_id' => $user->id,
            'plan_id' => $plan->id,
            'api_key' => \Illuminate\Support\Str::random(32),
            'encryption_key' => \Illuminate\Support\Str::random(32),
            'organization_type' => $validated['organization_type'],
            'billing_period' => $validated['billing_period'],
            'billing_address' => $validated['billing_address'],
            'tax_number' => $validated['tax_number'],
        ]);

        // Rediriger vers ajout de serveur
        return redirect()->route('organizations.servers.create', $organization->id)
            ->with('success', "Organization '{$organization->name}' created successfully! Now let's add your first server.");
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
                'billing_period' => $organization->billing_period ?? 'yearly',
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

    /**
     * Afficher la page de changement de plan d'une organisation
     */
    public function changePlan(Request $request, Organization $organization)
    {
        // Vérifier que l'utilisateur a accès à cette organisation
        if (!$organization->hasMember($request->user())) {
            abort(403, 'Accès non autorisé à cette organisation.');
        }

        // Charger les relations nécessaires
        $organization->load(['plan', 'servers', 'members']);

        // Récupérer tous les plans actifs
        $plans = \App\Models\Plan::where('is_active', true)
            ->orderBy('price->monthly')
            ->get();

        // Calculer l'utilisation actuelle
        $currentUsage = [
            'servers' => $organization->servers()->count(),
            'members' => $organization->members()->count(),
            // 'metrics' => $organization->servers()->sum('metrics_count') ?? 0, // Assuming you have this field
        ];

        // Enrichir l'organisation avec les données nécessaires
        $organizationData = [
            'id' => $organization->id,
            'name' => $organization->name,
            'logo' => $organization->logo,
            'description' => $organization->description,
            'owner_id' => $organization->owner_id,
            'plan' => $organization->plan ? [
                'id' => $organization->plan->id,
                'name' => $organization->plan->name,
                'description' => $organization->plan->description,
                'price' => $organization->plan->price,
                'billing_period' => $organization->billing_period ?? 'yearly',
                'max_servers' => $organization->plan->max_servers,
                'max_organizations' => $organization->plan->max_organizations,
                'max_metrics' => $organization->plan->max_metrics,
                'frequency' => $organization->plan->frequency,
                'is_active' => $organization->plan->is_active,
            ] : null,
            'servers_count' => $organization->servers()->count(),
            'members_count' => $organization->members()->count(),
        ];

        return Inertia::render('User/Organizations/ChangePlan', [
            'organization' => $organizationData,
            'plans' => $plans,
            'currentUsage' => $currentUsage,
        ]);
    }

    /**
     * Mettre à jour le plan d'une organisation
     */
    public function updatePlan(Request $request, Organization $organization)
    {
        // Vérifier que l'utilisateur a accès à cette organisation
        if (!$organization->hasMember($request->user())) {
            abort(403, 'Accès non autorisé à cette organisation.');
        }

        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'billing_period' => 'required|in:monthly,yearly',
        ]);

        $newPlan = \App\Models\Plan::findOrFail($validated['plan_id']);

        // Vérifier les contraintes d'utilisation pour les downgrades
        $currentUsage = [
            'servers' => $organization->servers()->count(),
            'members' => $organization->members()->count(),
            // 'metrics' => $organization->servers()->sum('metrics_count') ?? 0,
        ];

        $constraints = [];

        if ($newPlan->max_servers !== -1 && $currentUsage['servers'] > $newPlan->max_servers) {
            $constraints[] = "You have {$currentUsage['servers']} servers but this plan limits to {$newPlan->max_servers}";
        }

        // if ($newPlan->max_metrics !== -1 && $currentUsage['metrics'] > $newPlan->max_metrics) {
        //     $constraints[] = "You have {$currentUsage['metrics']} metrics but this plan limits to {$newPlan->max_metrics}";
        // }

        if (!empty($constraints)) {
            return back()->withErrors([
                'plan_change' => 'Cannot change to this plan due to usage constraints: ' . implode(', ', $constraints)
            ]);
        }

        // Mettre à jour le plan et la période de facturation
        $organization->update([
            'plan_id' => $newPlan->id,
            'billing_period' => $validated['billing_period'],
        ]);

        return redirect()->route('organizations.billing', $organization->id)
            ->with('success', "Plan successfully changed to {$newPlan->name}!");
    }
}
