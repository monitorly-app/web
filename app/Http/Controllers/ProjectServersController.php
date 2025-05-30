<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectServersController extends Controller
{
    /**
     * Display the servers list for a project
     */
    public function index(Project $project)
    {
        // Vérifier les permissions de l'utilisateur
        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canViewServers']) {
            abort(403, 'You do not have permission to view servers.');
        }

        // Récupérer les serveurs du projet
        $servers = $project->servers()
            ->active()
            ->orderBy('name')
            ->get()
            ->map(function ($server) {
                return [
                    'id' => $server->id,
                    'name' => $server->name,
                    'host' => $server->host,
                    'port' => $server->port,
                    'status' => $server->status,
                    'last_seen' => $server->last_seen_at?->toISOString(),
                    'agent_version' => $server->agent_version,
                    'uptime' => $this->formatUptime($server->getCurrentMetrics()['uptime'] ?? 0),
                    'metrics' => $server->getCurrentMetrics(),
                ];
            });

        // Statistiques
        $allServers = $project->servers()->active()->get();
        $stats = [
            'total_servers' => $allServers->count(),
            'online_servers' => $allServers->where('status', 'online')->count(),
            'offline_servers' => $allServers->filter(fn($s) => $s->isOffline())->count(),
            'warning_servers' => $allServers->where('status', 'warning')->count(),
        ];

        return Inertia::render('User/Projects/Servers/Index', [
            'project' => $project,
            'servers' => $servers,
            'stats' => $stats,
            'permissions' => $permissions,
            'userPlan' => Auth::user()->plan,
        ]);
    }

    /**
     * Show the form for creating a new server
     */
    public function create(Project $project)
    {
        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canManageServers']) {
            abort(403, 'You do not have permission to add servers.');
        }

        // Vérifier les limites du plan
        $userPlan = Auth::user()->plan;
        $currentServerCount = $project->servers()->active()->count();

        if ($userPlan->max_servers !== -1 && $currentServerCount >= $userPlan->max_servers) {
            return redirect()->route('projects.servers.index', $project)
                ->with('error', "You have reached the maximum number of servers ({$userPlan->max_servers}) for your {$userPlan->name} plan.");
        }

        return Inertia::render('User/Projects/Servers/Create', [
            'project' => $project,
            'userPlan' => $userPlan,
            'currentServerCount' => $currentServerCount,
        ]);
    }

    /**
     * Store a newly created server
     */
    public function store(Request $request, Project $project)
    {
        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canManageServers']) {
            abort(403, 'You do not have permission to add servers.');
        }

        // Vérifier les limites du plan
        $userPlan = Auth::user()->plan;
        $currentServerCount = $project->servers()->active()->count();

        if ($userPlan->max_servers !== -1 && $currentServerCount >= $userPlan->max_servers) {
            return redirect()->back()
                ->with('error', "You have reached the maximum number of servers ({$userPlan->max_servers}) for your {$userPlan->name} plan.");
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'description' => 'nullable|string|max:1000',
        ]);

        // Vérifier que le nom est unique dans le projet
        $existingServer = $project->servers()
            ->where('name', $validated['name'])
            ->where('is_active', true)
            ->first();

        if ($existingServer) {
            return redirect()->back()
                ->withErrors(['name' => 'A server with this name already exists in this project.'])
                ->withInput();
        }

        // Créer le serveur
        $server = Server::create([
            'project_id' => $project->id,
            'name' => $validated['name'],
            'host' => $validated['host'],
            'port' => $validated['port'],
            'description' => $validated['description'],
            'status' => 'pending',
        ]);

        return redirect()->route('projects.servers.show', [$project, $server])
            ->with('success', 'Server added successfully! Please install the monitoring agent to start receiving data.');
    }

    /**
     * Display the specified server
     */
    public function show(Project $project, Server $server)
    {
        // Vérifier que le serveur appartient au projet
        if ($server->project_id !== $project->id) {
            abort(404);
        }

        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canViewServers']) {
            abort(403, 'You do not have permission to view servers.');
        }

        // Charger les données du serveur avec métriques
        $serverData = [
            'id' => $server->id,
            'name' => $server->name,
            'host' => $server->host,
            'port' => $server->port,
            'description' => $server->description,
            'status' => $server->status,
            'last_seen' => $server->last_seen_at?->toISOString(),
            'agent_version' => $server->agent_version,
            'token' => $server->token,
            'install_command' => $server->getInstallCommand(),
            'metrics' => $server->getCurrentMetrics(),
            'system_info' => $server->getFormattedSystemInfo(),
            'created_at' => $server->created_at->toISOString(),
        ];

        return Inertia::render('User/Projects/Servers/Show', [
            'project' => $project,
            'server' => $serverData,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified server
     */
    public function update(Request $request, Project $project, Server $server)
    {
        // Vérifier que le serveur appartient au projet
        if ($server->project_id !== $project->id) {
            abort(404);
        }

        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canManageServers']) {
            abort(403, 'You do not have permission to edit servers.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'description' => 'nullable|string|max:1000',
        ]);

        // Vérifier que le nom est unique dans le projet (sauf pour ce serveur)
        $existingServer = $project->servers()
            ->where('name', $validated['name'])
            ->where('is_active', true)
            ->where('id', '!=', $server->id)
            ->first();

        if ($existingServer) {
            return redirect()->back()
                ->withErrors(['name' => 'A server with this name already exists in this project.'])
                ->withInput();
        }

        $server->update($validated);

        return redirect()->back()
            ->with('success', 'Server updated successfully.');
    }

    /**
     * Remove the specified server
     */
    public function destroy(Project $project, Server $server)
    {
        // Vérifier que le serveur appartient au projet
        if ($server->project_id !== $project->id) {
            abort(404);
        }

        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canManageServers']) {
            abort(403, 'You do not have permission to delete servers.');
        }

        // Soft delete en marquant comme inactif
        $server->update(['is_active' => false]);

        return redirect()->route('projects.servers.index', $project)
            ->with('success', 'Server deleted successfully.');
    }

    /**
     * Regenerate server token
     */
    public function regenerateToken(Project $project, Server $server)
    {
        // Vérifier que le serveur appartient au projet
        if ($server->project_id !== $project->id) {
            abort(404);
        }

        $permissions = $this->getUserProjectPermissions($project, Auth::user());

        if (!$permissions['canManageServers']) {
            abort(403, 'You do not have permission to regenerate server tokens.');
        }

        $newToken = $server->regenerateToken();

        return redirect()->back()
            ->with('success', 'Server token regenerated successfully. Please update your agent configuration.');
    }

    /**
     * Get user permissions for the project
     */
    private function getUserProjectPermissions(Project $project, $user): array
    {
        $isOwner = $project->owner_id === $user->id;

        $userMembership = $project->members?->find($user->id);
        $userProjectRole = $userMembership?->pivot?->project_role_id;

        // Mapping des rôles (basé sur les IDs du seeder)
        // 1 = Owner, 2 = Admin, 3 = Engineer, 4 = Developer, 5 = Viewer
        $isProjectAdmin = $userProjectRole === 2;
        $isEngineer = $userProjectRole === 3;
        $isDeveloper = $userProjectRole === 4;

        return [
            'canViewServers' => true,
            'canManageServers' => $isOwner || $isProjectAdmin || $isEngineer,
            'canDeleteServers' => $isOwner || $isProjectAdmin,
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
}
