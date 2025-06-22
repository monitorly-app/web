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

        Log::info('=== METRICS ENDPOINT HIT ===', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'project_id' => $request->route('project_id'),
            'headers' => $request->headers->all(),
            'body_preview' => substr($request->getContent(), 0, 200)
        ]);

        Log::info('=== RAW REQUEST BODY ===', [
            'raw_body' => $request->getContent(),
            'parsed_body' => json_decode($request->getContent(), true)
        ]);

        try {


            // 1. Validation de base
            $validator = Validator::make($request->all(), [
                'machine_name' => 'required|string|max:255',
                'metrics' => 'required|array',
                'metrics.*.timestamp' => 'required|string',
                'metrics.*.category' => 'required|string',
                'metrics.*.name' => 'required|string',
                'metrics.*.value' => 'required|numeric',
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

            $applicationToken = substr($authHeader, 7); // Enlever "Bearer "

            // 3. Trouver le projet via l'URL (project_id dans l'URL de l'API)
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
                    'host' => $request->ip(), // IP de la probe
                    'port' => 22, // Port par défaut
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
        $now = now();

        foreach ($metrics as $metric) {
            $metricsToInsert[] = [
                'server_id' => $server->id,
                'category' => $metric['category'],
                'name' => $metric['name'],
                'value' => $metric['value'],
                'metadata' => isset($metric['metadata']) ? json_encode($metric['metadata']) : null,
                'timestamp' => $metric['timestamp'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insertion en lot pour les performances
        if (!empty($metricsToInsert)) {
            Metric::insert($metricsToInsert);
        }

        // Sauvegarder le boot time si fourni
        if ($bootTime !== null) {
            $server->update(['boot_time' => $bootTime]);
        }

        // Nettoyer les anciennes métriques (garder seulement 30 jours)
        $this->cleanupOldMetrics($server);
    }

    /**
     * Nettoyer les anciennes métriques pour éviter que la DB grossisse trop
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

        // Récupérer les métriques des 24 dernières heures
        $metrics = $server->metrics()
            ->where('timestamp', '>=', now()->subDay())
            ->orderBy('timestamp', 'desc')
            ->limit(1000)
            ->get();

        return response()->json([
            'server' => $server,
            'metrics' => $metrics->groupBy(['category', 'name'])
        ]);
    }
}
