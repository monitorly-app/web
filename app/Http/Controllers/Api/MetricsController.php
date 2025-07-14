<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\Server;
use App\Models\Metric;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MetricsController extends Controller
{
    /**
     * Recevoir les métriques de la probe Monitorly
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // 1. Validation de base
            $validator = Validator::make($request->all(), [
                'machine_name' => 'required|string|max:255',
                'metrics' => 'required|array',
                'metrics.*.timestamp' => 'required|string',
                'metrics.*.category' => 'required|string',
                'metrics.*.name' => 'required|string',
                'metrics.*.value' => 'required', // ← Accepte objet ou nombre
                'boot_time' => 'nullable|integer',
                'encrypted' => 'boolean',
                'compressed' => 'boolean',
            ]);

            if ($validator->fails()) {
                Log::warning('Invalid metrics payload', ['errors' => $validator->errors()]);
                return response()->json(['error' => 'Invalid payload'], 400);
            }

            // 2. Authentification via Bearer token
            $authHeader = $request->header('Authorization');
            if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
                return response()->json(['error' => 'Missing or invalid authorization header'], 401);
            }

            $applicationToken = substr($authHeader, 7);

            // 3. Trouver l'organisation via l'URL
            $organizationId = $request->route('organization_id');
            $organization = Organization::where('id', $organizationId)
                ->where('api_key', $applicationToken)
                ->first();

            if (!$organization) {
                Log::warning('Invalid organization or API key', [
                    'organization_id' => $organizationId,
                    'token_prefix' => substr($applicationToken, 0, 8) . '...'
                ]);
                return response()->json(['error' => 'Invalid organization or API key'], 401);
            }

            // 4. Check plan limits - REMOVED: We don't need API request counting
            // Rate limiting should be based on collection intervals, not request count

            // 5. Trouver ou créer le serveur
            $machineName = $request->input('machine_name');
            $server = $organization->servers()
                ->where('name', $machineName)
                ->where('is_active', true)
                ->first();

            if (!$server) {
                // Créer automatiquement le serveur s'il n'existe pas
                $server = $organization->servers()->create([
                    'name' => $machineName,
                    'host' => $request->ip(),
                    'port' => 22,
                    'description' => 'Auto-created from Monitorly probe',
                    'is_active' => true,
                    'status' => 'online',
                ]);

                Log::info('Auto-created server from probe', [
                    'server_id' => $server->id,
                    'machine_name' => $machineName,
                    'organization_id' => $organization->id
                ]);
            } else {
                // Mettre à jour le statut du serveur existant
                $server->update([
                    'status' => 'online',
                    'last_seen_at' => now(),
                ]);
            }

            // 6. Traiter les métriques
            $metrics = $request->input('metrics', []);
            $bootTime = $request->input('boot_time');

            $this->processMetrics($server, $metrics, $bootTime);

            // 7. Log de succès
            Log::info('Metrics received successfully', [
                'server_id' => $server->id,
                'organization_id' => $organization->id,
                'metrics_count' => count($metrics),
                'machine_name' => $machineName
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Metrics received successfully',
                'server_id' => $server->id,
                'metrics_processed' => count($metrics)
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing metrics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Traiter et sauvegarder les métriques
     */
    private function processMetrics(Server $server, array $metrics, ?int $bootTime): void
    {
        $metricsToInsert = [];
        $lastMetrics = [];
        $systemInfoUpdated = false;
        $now = now();

        // Détecter la version de l'agent depuis les headers ou user-agent
        $agentVersion = $this->detectAgentVersion(request());
        if ($agentVersion && $server->agent_version !== $agentVersion) {
            $server->update(['agent_version' => $agentVersion]);
            Log::info('Updated agent version', [
                'server_id' => $server->id,
                'version' => $agentVersion
            ]);
        }

        foreach ($metrics as $metric) {
            $category = $metric['category'];
            $name = $metric['name'];
            $value = $metric['value'];

            // CAS SPÉCIAL : system_info va dans servers.system_info
            if ($category === 'system' && $name === 'system_info') {
                if (is_array($value)) {
                    $server->update(['system_info' => $value]);
                    $systemInfoUpdated = true;
                    Log::info('Updated system_info for server', [
                        'server_id' => $server->id,
                        'system_info' => $value
                    ]);
                }
                continue;
            }

            // AUTRES MÉTRIQUES : traitement normal
            $numericValue = $this->extractNumericValue($value);

            // Stocker dans la table metrics
            $metricsToInsert[] = [
                'server_id' => $server->id,
                'category' => $category,
                'name' => $name,
                'value' => $numericValue,
                'metadata' => $this->prepareMetadata($metric),
                'timestamp' => $metric['timestamp'],
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Stocker pour last_metrics
            $lastMetrics["{$category}.{$name}"] = [
                'value' => $numericValue,
                'timestamp' => $metric['timestamp'],
                'metadata' => is_array($value) ? $value : null,
            ];
        }

        // Insertion en lot des métriques
        if (!empty($metricsToInsert)) {
            Metric::insert($metricsToInsert);
        }

        // Mettre à jour last_metrics
        if (!empty($lastMetrics)) {
            $currentLastMetrics = $server->last_metrics ?? [];
            $server->update(['last_metrics' => array_merge($currentLastMetrics, $lastMetrics)]);
        }

        // Si pas de system_info explicite, essayer de le construire depuis les métriques
        if (!$systemInfoUpdated && empty($server->system_info)) {
            $this->buildSystemInfoFromMetrics($server, $lastMetrics);
        }

        // Sauvegarder le boot time si fourni
        if ($bootTime !== null) {
            $server->update(['boot_time' => $bootTime]);
        }

        // Nettoyer les anciennes métriques
        $this->cleanupOldMetrics($server);
    }

    /**
     * Détecter la version de l'agent
     */
    private function detectAgentVersion($request): ?string
    {
        // Essayer User-Agent header
        $userAgent = $request->header('User-Agent');
        if ($userAgent && preg_match('/Monitorly.*?v?([0-9]+\.[0-9]+\.[0-9]+)/', $userAgent, $matches)) {
            return $matches[1];
        }

        // Essayer un header personnalisé
        $agentVersion = $request->header('X-Agent-Version');
        if ($agentVersion) {
            return $agentVersion;
        }

        // Valeur par défaut basée sur les logs qu'on a vus
        return 'v0.1.0';
    }

    /**
     * Construire system_info depuis les métriques disponibles
     */
    private function buildSystemInfoFromMetrics(Server $server, array $lastMetrics): void
    {
        $systemInfo = [];

        // Extraire les infos du disque depuis les métadonnées
        if (isset($lastMetrics['system.disk']['metadata'])) {
            $diskMetadata = $lastMetrics['system.disk']['metadata'];
            if (isset($diskMetadata['total'])) {
                $systemInfo['total_disk'] = $diskMetadata['total'];
            }
        }

        // Infos de base qu'on peut deviner
        $systemInfo['os'] = 'Linux (auto-detected)';
        $systemInfo['kernel'] = 'Unknown';
        $systemInfo['cpu_model'] = 'Unknown';
        $systemInfo['cpu_cores'] = 1; // Valeur par défaut
        $systemInfo['hostname'] = $server->name;

        // Si on a des infos, les sauvegarder
        if (!empty($systemInfo)) {
            $server->update(['system_info' => $systemInfo]);
            Log::info('Built basic system_info from metrics', [
                'server_id' => $server->id,
                'system_info' => $systemInfo
            ]);
        }
    }

    /**
     * Extraire une valeur numérique selon le type
     */
    private function extractNumericValue($value): float
    {
        // Si c'est déjà un nombre
        if (is_numeric($value)) {
            return (float) $value;
        }

        // Si c'est un objet (comme disk avec percent)
        if (is_array($value)) {
            if (isset($value['percent'])) {
                return (float) $value['percent'];
            }
            if (isset($value['value'])) {
                return (float) $value['value'];
            }
            // Pour les objets complexes, retourner 0
            return 0.0;
        }

        return 0.0;
    }

    /**
     * Préparer les métadonnées
     */
    private function prepareMetadata(array $metric): ?string
    {
        $metadata = [];

        // Ajouter les métadonnées explicites si présentes
        if (isset($metric['metadata']) && is_array($metric['metadata'])) {
            $metadata = array_merge($metadata, $metric['metadata']);
        }

        // Si la valeur est un objet, l'inclure dans metadata
        if (is_array($metric['value'])) {
            $metadata['original_value'] = $metric['value'];
        }

        return !empty($metadata) ? json_encode($metadata) : null;
    }

    /**
     * Nettoyer les anciennes métriques
     */
    private function cleanupOldMetrics(Server $server): void
    {
        $server->metrics()
            ->where('created_at', '<', now()->subDays(30))
            ->delete();
    }

    /**
     * Obtenir les métriques récentes d'un serveur
     */
    public function getServerMetrics(Request $request, string $organizationId, string $serverId): JsonResponse
    {
        // Authentification similaire...
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Missing authorization'], 401);
        }

        $applicationToken = substr($authHeader, 7);
        $organization = Organization::where('id', $organizationId)
            ->where('api_key', $applicationToken)
            ->first();

        if (!$organization) {
            return response()->json(['error' => 'Invalid organization or API key'], 401);
        }

        $server = $organization->servers()->where('id', $serverId)->first();
        if (!$server) {
            return response()->json(['error' => 'Server not found'], 404);
        }

        // Gérer les différents formats de période
        $startDate = $this->calculateStartDate($request);

        Log::info('Fetching metrics', [
            'server_id' => $serverId,
            'start_date' => $startDate->toISOString(),
            'request_params' => $request->all()
        ]);

        // Récupérer et grouper les métriques par type
        $metrics = $server->metrics()
            ->where('timestamp', '>=', $startDate)
            ->orderBy('timestamp', 'asc')
            ->get()
            ->groupBy(['category', 'name']);

        // Formater les données pour les charts
        $formatMetrics = function ($metricsCollection) {
            return $metricsCollection->map(function ($metric) {
                return [
                    'timestamp' => $metric->timestamp->toISOString(),
                    'value' => $metric->value,
                    'formatted_time' => $metric->timestamp->format('Y-m-d H:i:s')
                ];
            })->values();
        };

        $result = [
            'server' => $server,
            'cpu' => $formatMetrics($metrics['system']['cpu'] ?? collect()),
            'ram' => $formatMetrics($metrics['system']['ram'] ?? collect()),
            'disk' => $formatMetrics($metrics['system']['disk'] ?? collect()),
            'period_info' => [
                'start_date' => $startDate->toISOString(),
                'end_date' => now()->toISOString(),
                'duration_hours' => $startDate->diffInHours(now()),
                'data_points' => [
                    'cpu' => ($metrics['system']['cpu'] ?? collect())->count(),
                    'ram' => ($metrics['system']['ram'] ?? collect())->count(),
                    'disk' => ($metrics['system']['disk'] ?? collect())->count(),
                ]
            ]
        ];

        return response()->json($result);
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
