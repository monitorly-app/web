<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServerCreateRequest;
use App\Http\Requests\ServerUpdateRequest;
use App\Models\Organization;
use App\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganizationServersController extends Controller
{
    /**
     * Middleware pour vérifier les permissions
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('organization.access')->except(['generateScript']);
        $this->middleware('organization.owner')->only(['create', 'store', 'edit', 'update', 'destroy']);
    }

    /**
     * Afficher la liste des serveurs
     */
    public function index(Organization $organization)
    {
        $servers = $organization->servers()
            ->with('metrics')
            ->withCount('metrics')
            ->latest()
            ->paginate(10);

        // Calculer les statistiques pour chaque serveur
        $servers->getCollection()->transform(function ($server) {
            // Dernière métrique pour déterminer le statut
            $lastMetric = $server->metrics()->latest()->first();

            if (!$lastMetric) {
                $server->status = 'offline';
                $server->cpu_usage = 0;
                $server->ram_usage = 0;
                $server->disk_usage = 0;
            } else {
                // Serveur en ligne si dernière métrique < 5 minutes
                $isOnline = $lastMetric->created_at->diffInMinutes(now()) < 5;
                $server->status = $isOnline ? 'online' : 'offline';

                // Récupérer les dernières métriques par type
                $server->cpu_usage = $server->metrics()->where('type', 'cpu')->latest()->value('value') ?? 0;
                $server->ram_usage = $server->metrics()->where('type', 'ram')->latest()->value('value') ?? 0;
                $server->disk_usage = $server->metrics()->where('type', 'disk')->latest()->value('value') ?? 0;
            }

            $server->last_ping_at = $lastMetric?->created_at;

            return $server;
        });

        // Calculer les statistiques de l'organisation
        $stats = [
            'total_servers' => $organization->servers()->count(),
            'online_servers' => $organization->servers()->online()->count(),
            'offline_servers' => $organization->servers()->offline()->count(),
            'warning_servers' => $organization->servers()->where('status', 'warning')->count(),
        ];

        // Obtenir les permissions de l'utilisateur
        $permissions = $this->getUserOrganizationPermissions($organization, Auth::user());

        return Inertia::render('User/Organizations/Servers/Index', [
            'organization' => $organization->load(['owner', 'plan']),
            'servers' => $servers->items(), // Seulement les données, pas l'objet de pagination
            'stats' => $stats,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create(Organization $organization)
    {
        // Obtenir les informations sur le plan et les limites
        $owner = $organization->owner;
        $currentServerCount = $organization->servers()->count();

        return Inertia::render('User/Organizations/Servers/Create', [
            'organization' => $organization->load('plan'),
            'currentServerCount' => $currentServerCount,
        ]);
    }

    /**
     * Générer le script d'installation pour un serveur
     */
    public function generateScript(Request $request)
    {
        try {
            // Log de débogage
            Log::info('generateScript called', ['request' => $request->all()]);

            $request->validate([
                'organization_id' => 'required|uuid|exists:organizations,id',
                'server_name' => 'required|string|max:255',
                'metrics' => 'required|array|min:1',
                'metrics.*' => 'string|in:cpu,ram,disk,network,user_activity,login_failures,port_monitoring'
            ]);

            Log::info('Validation passed');

            $organization = Organization::findOrFail($request->organization_id);
            Log::info('Organization found', ['org_id' => $organization->id]);

            // Vérification d'accès - propriétaire ou membre
            $user = Auth::user();
            if (!$user) {
                Log::error('User not authenticated');
                abort(401, 'User not authenticated');
            }

            Log::info('User authenticated', ['user_id' => $user->id]);

            // Vérifier si l'utilisateur est propriétaire ou membre
            $isOwner = $organization->owner_id === $user->id;
            $isMember = $organization->users()->where('user_id', $user->id)->exists();

            if (!$isOwner && !$isMember) {
                Log::error('Access denied', [
                    'user_id' => $user->id,
                    'owner_id' => $organization->owner_id,
                    'is_member' => $isMember
                ]);
                abort(403, 'Access denied to this organization');
            }

            Log::info('Access granted', ['is_owner' => $isOwner, 'is_member' => $isMember]);

            // Générer un token unique pour le serveur
            $serverToken = 'srv_' . Str::random(32);
            Log::info('Token generated', ['token' => $serverToken]);

            // Stocker temporairement les informations du serveur en session
            session([
                'pending_server' => [
                    'token' => $serverToken,
                    'name' => $request->server_name,
                    'metrics' => $request->metrics,
                    'organization_id' => $organization->id,
                    'created_at' => now(),
                ]
            ]);

            Log::info('Session data stored');

            // Générer l'URL du script d'installation
            $installUrl = route('install.script', $serverToken);
            Log::info('Install URL generated', ['url' => $installUrl]);

            return response()->json([
                'token' => $serverToken,
                'script' => $installUrl,
                'command' => "curl -sSL \"{$installUrl}\" | bash"
            ]);
        } catch (\Exception $e) {
            Log::error('Error in generateScript: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'error' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher le formulaire de création
     */
    public function createForm(Organization $organization)
    {
        return Inertia::render('User/Organizations/Servers/Create', [
            'organization' => $organization,
        ]);
    }

    /**
     * Créer un nouveau serveur
     */
    public function store(Request $request, Organization $organization)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'metrics' => 'required|array|min:1',
        ]);

        // Vérifier les limites du plan
        $currentServerCount = $organization->servers()->count();

        if ($organization->plan && $organization->plan->max_servers !== -1 && $currentServerCount >= $organization->plan->max_servers) {
            return back()->withErrors([
                'general' => "You have reached the maximum number of servers for your plan ({$organization->plan->max_servers})"
            ]);
        }

        // Récupérer les données du serveur en attente depuis la session
        $pendingServer = session('pending_server');

        if (!$pendingServer) {
            return back()->withErrors([
                'general' => 'Server configuration not found. Please restart the process.'
            ]);
        }

        // Créer le serveur avec le statut pending
        $server = $organization->servers()->create([
            'id' => Str::uuid(),
            'name' => $request->name,
            'hostname' => null, // Sera rempli par l'agent
            'ip_address' => null, // Sera rempli par l'agent
            'port' => 22, // Par défaut
            'description' => $request->description,
            'token' => $pendingServer['token'],
            'status' => 'pending',
            'monitoring_config' => json_encode($request->metrics),
        ]);

        // Nettoyer la session
        session()->forget('pending_server');

        return redirect()->route('organizations.servers.index', $organization)
            ->with('success', "Server '{$server->name}' has been added and is waiting for the monitoring agent to connect.");
    }

    /**
     * Afficher un serveur
     */
    public function show(Request $request, Organization $organization, Server $server)
    {
        // Vérifier que le serveur appartient à l'organisation
        if ($server->organization_id !== $organization->id) {
            abort(404);
        }

        // Charger les relations nécessaires
        $server->load(['metrics' => function ($query) {
            $query->latest()->limit(100);
        }]);

        // Calculer les statistiques actuelles
        $lastMetric = $server->metrics()->latest()->first();

        if (!$lastMetric) {
            $server->status = 'offline';
            $server->cpu_usage = 0;
            $server->ram_usage = 0;
            $server->disk_usage = 0;
        } else {
            $isOnline = $lastMetric->created_at->diffInMinutes(now()) < 5;
            $server->status = $isOnline ? 'online' : 'offline';

            $server->cpu_usage = $server->metrics()->where('type', 'cpu')->latest()->value('value') ?? 0;
            $server->ram_usage = $server->metrics()->where('type', 'ram')->latest()->value('value') ?? 0;
            $server->disk_usage = $server->metrics()->where('type', 'disk')->latest()->value('value') ?? 0;
        }

        $server->last_ping_at = $lastMetric?->created_at;

        return Inertia::render('User/Organizations/Servers/Show', [
            'organization' => $organization->load('owner'),
            'server' => $server,
            'permissions' => $this->getUserOrganizationPermissions($organization, $request->user()),
        ]);
    }

    /**
     * Afficher le formulaire d'édition
     */
    public function edit(Organization $organization, Server $server)
    {
        if ($server->organization_id !== $organization->id) {
            abort(404);
        }

        return response()->json($server);
    }

    /**
     * Mettre à jour un serveur
     */
    public function update(ServerUpdateRequest $request, Organization $organization, Server $server)
    {
        if ($server->organization_id !== $organization->id) {
            abort(404);
        }

        $server->update($request->validated());

        return response()->json([
            'message' => 'Server updated successfully',
            'server' => $server->fresh(),
        ]);
    }

    /**
     * Supprimer un serveur
     */
    public function destroy(Organization $organization, Server $server)
    {
        if ($server->organization_id !== $organization->id) {
            abort(404);
        }

        // Supprimer toutes les métriques associées
        $server->metrics()->delete();

        // Supprimer le serveur
        $server->delete();

        return redirect()->route('organizations.servers.index', $organization)
            ->with('success', 'Server deleted successfully');
    }

    /**
     * Regenerate server token
     */
    public function regenerateToken(Organization $organization, Server $server)
    {
        // Vérifier que le serveur appartient à l'organisation
        if ($server->organization_id !== $organization->id) {
            abort(404);
        }

        $newToken = $server->regenerateToken();

        return redirect()->back()
            ->with('success', 'Server token regenerated successfully. Please update your agent configuration.');
    }

    /**
     * Get user permissions for the organization
     */
    private function getUserOrganizationPermissions(Organization $organization, $user): array
    {
        $isOwner = $organization->owner_id === $user->id;

        $userMembership = $organization->members?->find($user->id);
        $userOrganizationRole = $userMembership?->pivot?->organization_role_id;

        // Mapping des rôles (basé sur les IDs du seeder)
        // 1 = Owner, 2 = Admin, 3 = Engineer, 4 = Developer, 5 = Viewer
        $isOrganizationAdmin = $userOrganizationRole === 2;
        $isEngineer = $userOrganizationRole === 3;
        $isDeveloper = $userOrganizationRole === 4;

        return [
            'canViewServers' => true,
            'canManageServers' => $isOwner || $isOrganizationAdmin || $isEngineer,
            'canDeleteServers' => $isOwner || $isOrganizationAdmin,
        ];
    }

    /**
     * Format uptime in a human readable format
     */
    private function formatUptime(int $seconds): string
    {
        if ($seconds === 0) {
            return 'N/A';
        }

        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        $parts = [];
        if ($days > 0) $parts[] = "{$days} day" . ($days > 1 ? 's' : '');
        if ($hours > 0) $parts[] = "{$hours} hour" . ($hours > 1 ? 's' : '');
        if ($minutes > 0 && $days === 0) $parts[] = "{$minutes} minute" . ($minutes > 1 ? 's' : '');

        return implode(', ', $parts) ?: 'Less than a minute';
    }

    /**
     * Get server metrics for charts (web route)
     */
    public function getMetrics(Request $request, Organization $organization, Server $server)
    {
        // Vérifier que le serveur appartient à l'organisation
        if ($server->organization_id !== $organization->id) {
            abort(404);
        }

        // Gérer les différents formats de période
        $startDate = $this->calculateStartDate($request);

        // Calculer la durée pour déterminer l'agrégation
        $durationHours = $startDate->diffInHours(now());

        // Déterminer le format de regroupement selon la base de données
        $driver = config('database.default');
        $isPostgres = $driver === 'pgsql';

        // Définir l'intervalle et le format selon la durée
        if ($durationHours <= 24) {
            // Pour les périodes courtes (≤ 24h), grouper par 15 minutes ou heure
            if ($durationHours <= 1) {
                // Pour 1h, grouper par 5 minutes
                $interval = $isPostgres
                    ? "date_trunc('minute', timestamp) + INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM timestamp) / 5)"
                    : "DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:00')"; // Approximation pour MySQL
            } else {
                // Pour 12h-24h, grouper par heure
                $interval = $isPostgres ? "date_trunc('hour', timestamp)" : "DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')";
            }
        } elseif ($durationHours <= 7 * 24) {
            // Pour 7 jours, grouper par heure
            $interval = $isPostgres ? "date_trunc('hour', timestamp)" : "DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')";
        } elseif ($durationHours <= 15 * 24) {
            // Pour 15 jours, grouper par 6 heures
            $interval = $isPostgres
                ? "date_trunc('hour', timestamp) + INTERVAL '6 hours' * FLOOR(EXTRACT(hour FROM timestamp) / 6)"
                : "DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')";
        } else {
            // Pour 30+ jours, grouper par jour
            $interval = $isPostgres ? "date_trunc('day', timestamp)" : "DATE_FORMAT(timestamp, '%Y-%m-%d 00:00:00')";
        }

        $cpuMetrics = $server->metrics()
            ->where('category', 'system')
            ->where('name', 'cpu')
            ->where('timestamp', '>=', $startDate)
            ->selectRaw("{$interval} as period, AVG(value) as value")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                return [
                    'timestamp' => $item->period,
                    'value' => round($item->value, 2),
                    'formatted_time' => \Carbon\Carbon::parse($item->period)->format('Y-m-d H:i:s')
                ];
            });

        $ramMetrics = $server->metrics()
            ->where('category', 'system')
            ->where('name', 'ram')
            ->where('timestamp', '>=', $startDate)
            ->selectRaw("{$interval} as period, AVG(value) as value")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                return [
                    'timestamp' => $item->period,
                    'value' => round($item->value, 2),
                    'formatted_time' => \Carbon\Carbon::parse($item->period)->format('Y-m-d H:i:s')
                ];
            });

        $diskMetrics = $server->metrics()
            ->where('category', 'system')
            ->where('name', 'disk')
            ->where('timestamp', '>=', $startDate)
            ->selectRaw("{$interval} as period, AVG(value) as value")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                return [
                    'timestamp' => $item->period,
                    'value' => round($item->value, 2),
                    'formatted_time' => \Carbon\Carbon::parse($item->period)->format('Y-m-d H:i:s')
                ];
            });

        return response()->json([
            'cpu' => $cpuMetrics,
            'ram' => $ramMetrics,
            'disk' => $diskMetrics,
            'period_info' => [
                'start_date' => $startDate->toISOString(),
                'end_date' => now()->toISOString(),
                'duration_hours' => $durationHours,
                'data_points' => [
                    'cpu' => $cpuMetrics->count(),
                    'ram' => $ramMetrics->count(),
                    'disk' => $diskMetrics->count(),
                ]
            ]
        ]);
    }

    /**
     * Calculer la date de début selon les paramètres de période
     */
    private function calculateStartDate(Request $request): \Carbon\Carbon
    {
        // Nouveau format unifié : period=1h, period=24h, period=7d, etc.
        if ($request->has('period')) {
            $period = $request->input('period');

            // Format : nombre + unité (h pour heures, d pour jours)
            if (preg_match('/^(\d+)([hd])$/', $period, $matches)) {
                $value = (int) $matches[1];
                $unit = $matches[2];

                if ($unit === 'h') {
                    return now()->subHours($value);
                } elseif ($unit === 'd') {
                    return now()->subDays($value);
                }
            }
        }

        // Anciens paramètres pour compatibilité
        if ($request->has('hours')) {
            $hours = (int) $request->input('hours', 24);
            return now()->subHours($hours);
        }

        if ($request->has('days')) {
            $days = (int) $request->input('days', 7);
            return now()->subDays($days);
        }

        // Valeur par défaut : 7 jours
        return now()->subDays(7);
    }
}
