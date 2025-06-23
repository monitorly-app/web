<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Server;
use App\Models\Metric;
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

            // 3. Trouver le projet via l'URL
            $projectId = $request->route('project_id');
            $project = Project::where('id', $projectId)
                ->where('api_key', $applicationToken)
                ->first();

            if (!$project) {
                Log::warning('Invalid project or API key', [
                    'project_id' => $projectId,
                    'token_prefix' => substr($applicationToken, 0, 8) . '...'
                ]);
                return response()->json(['error' => 'Invalid project or API key'], 401);
            }

            // 4. Vérifier les limites du plan
            if (!$project->canMakeApiRequest()) {
                return response()->json(['error' => 'API request limit exceeded'], 429);
            }

            // 5. Trouver ou créer le serveur
            $machineName = $request->input('machine_name');
            $server = $project->servers()
                ->where('name', $machineName)
                ->where('is_active', true)
                ->first();

            if (!$server) {
                // Créer automatiquement le serveur s'il n'existe pas
                $server = $project->servers()->create([
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
                    'project_id' => $project->id
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
                'project_id' => $project->id,
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
                continue; // Ne pas stocker dans metrics table
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
            $server->update(['last_metrics' => $lastMetrics]);
        }

        // Sauvegarder le boot time si fourni
        if ($bootTime !== null) {
            $server->update(['boot_time' => $bootTime]);
        }

        // Nettoyer les anciennes métriques
        $this->cleanupOldMetrics($server);
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
    public function getServerMetrics(Request $request, string $projectId, string $serverId): JsonResponse
    {
        // Authentification similaire...
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Missing authorization'], 401);
        }

        $applicationToken = substr($authHeader, 7);
        $project = Project::where('id', $projectId)
            ->where('api_key', $applicationToken)
            ->first();

        if (!$project) {
            return response()->json(['error' => 'Invalid project or API key'], 401);
        }

        $server = $project->servers()->where('id', $serverId)->first();
        if (!$server) {
            return response()->json(['error' => 'Server not found'], 404);
        }

        // Récupérer le nombre de jours depuis les paramètres
        $days = $request->input('days', 7);
        $startDate = now()->subDays($days);

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

        return response()->json([
            'server' => $server,
            'cpu' => $formatMetrics($metrics['system']['cpu'] ?? collect()),
            'ram' => $formatMetrics($metrics['system']['ram'] ?? collect()),
            'disk' => $formatMetrics($metrics['system']['disk'] ?? collect()),
        ]);
    }
}
