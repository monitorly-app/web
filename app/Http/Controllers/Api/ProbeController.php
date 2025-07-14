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
use Carbon\Carbon;

class ProbeController extends Controller
{
    /**
     * Handle system information from probe startup
     * POST /api/{organization_id}/servers/{server_id}/info
     */
    public function storeSystemInfo(Request $request, string $organizationId, string $serverId): JsonResponse
    {
        try {
            // 1. Authenticate probe first
            $organization = $this->authenticateProbe($request, $organizationId);
            if (!$organization) {
                return $this->errorResponse('UNAUTHORIZED', 'Invalid authentication token', null, 401);
            }

            // 2. Handle encryption if present BEFORE validation
            if ($request->input('encrypted', false)) {
                $decryptedData = $organization->decryptData($request->input('data'));
                if (!$decryptedData) {
                    return $this->errorResponse('ENCRYPTION_FAILED', 'Failed to decrypt data', null, 412);
                }
                $request->merge($decryptedData);
            }

            // 3. Validate request structure AFTER decryption
            $validator = Validator::make($request->all(), [
                'machine_name' => 'required|string|max:255',
                'metrics' => 'required|array',
                'metrics.*.timestamp' => 'required|string',
                'metrics.*.category' => 'required|string|in:system',
                'metrics.*.name' => 'required|string|in:system_info',
                'metrics.*.value' => 'required|array',
                'encrypted' => 'boolean',
                'data' => 'string', // For encrypted payloads
            ]);

            if ($validator->fails()) {
                Log::warning('Invalid system info payload', [
                    'errors' => $validator->errors(),
                    'organization_id' => $organizationId,
                    'server_id' => $serverId
                ]);
                return $this->errorResponse('INVALID_REQUEST', 'Invalid payload format', $validator->errors()->toArray(), 400);
            }

            // 4. Find or create server
            $server = $this->findOrCreateServer($organization, $serverId, $request->input('machine_name'));

            // 5. Process system info metrics
            $metrics = $request->input('metrics', []);
            $this->processSystemInfoMetrics($server, $metrics);

            // 6. Update server status
            $server->update([
                'status' => 'online',
                'last_seen_at' => now(),
            ]);

            Log::info('System info received successfully', [
                'server_id' => $server->id,
                'organization_id' => $organization->id,
                'machine_name' => $request->input('machine_name')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'System information received successfully'
            ], 200, [
                'X-Configuration-Last-Update' => $server->monitoring_config_updated_at ?? now()->timestamp
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing system info', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'organization_id' => $organizationId,
                'server_id' => $serverId
            ]);

            return $this->errorResponse('INTERNAL_ERROR', 'Internal server error', null, 500);
        }
    }

    /**
     * Handle regular metrics from probe
     * POST /api/{organization_id}/servers/{server_id}/metrics
     */
    public function storeMetrics(Request $request, string $organizationId, string $serverId): JsonResponse
    {
        try {
            Log::info('Processing metrics request', [
                'organization_id' => $organizationId,
                'server_id' => $serverId,
                'request_keys' => array_keys($request->all()),
                'has_metrics' => $request->has('metrics'),
                'metrics_count' => $request->has('metrics') ? count($request->input('metrics', [])) : 0
            ]);

            // 1. Authenticate probe first
            $organization = $this->authenticateProbe($request, $organizationId);
            if (!$organization) {
                Log::warning('Metrics authentication failed', ['organization_id' => $organizationId]);
                return $this->errorResponse('UNAUTHORIZED', 'Invalid authentication token', null, 401);
            }

            // 2. Check plan limits - REMOVED: We don't need API request counting
            // Rate limiting should be based on collection intervals, not request count

            // 3. Handle encryption if present BEFORE validation
            if ($request->input('encrypted', false)) {
                Log::info('Processing encrypted metrics data');
                $decryptedData = $organization->decryptData($request->input('data'));
                if (!$decryptedData) {
                    Log::error('Failed to decrypt metrics data');
                    return $this->errorResponse('ENCRYPTION_FAILED', 'Failed to decrypt data', null, 412);
                }
                $request->merge($decryptedData);
                Log::info('Metrics data decrypted successfully', [
                    'decrypted_keys' => array_keys($decryptedData),
                    'metrics_count' => isset($decryptedData['metrics']) ? count($decryptedData['metrics']) : 0
                ]);
            }

            // 4. Validate request structure AFTER decryption
            $validator = Validator::make($request->all(), [
                'machine_name' => 'required|string|max:255',
                'metrics' => 'required|array',
                'metrics.*.timestamp' => 'required|string',
                'metrics.*.category' => 'required|string',
                'metrics.*.name' => 'required|string',
                'metrics.*.value' => 'required',
                'metrics.*.metadata' => 'sometimes|array',
                'encrypted' => 'boolean',
                'data' => 'string', // For encrypted payloads
            ]);

            if ($validator->fails()) {
                Log::warning('Invalid metrics payload', [
                    'errors' => $validator->errors(),
                    'organization_id' => $organizationId,
                    'server_id' => $serverId,
                    'request_data' => $request->all()
                ]);
                return $this->errorResponse('INVALID_REQUEST', 'Invalid payload format', $validator->errors()->toArray(), 400);
            }

            Log::info('Metrics validation passed', [
                'organization_id' => $organizationId,
                'server_id' => $serverId
            ]);

            // 5. Find server
            $server = $organization->servers()->where('id', $serverId)->first();
            if (!$server) {
                Log::error('Server not found', ['server_id' => $serverId, 'organization_id' => $organizationId]);
                return $this->errorResponse('NOT_FOUND', 'Server not found', null, 404);
            }

            // 6. Process metrics
            $metrics = $request->input('metrics', []);
            Log::info('Processing metrics', [
                'server_id' => $server->id,
                'metrics_count' => count($metrics),
                'metric_categories' => array_unique(array_column($metrics, 'category')),
                'metric_names' => array_unique(array_column($metrics, 'name'))
            ]);
            
            $this->processRegularMetrics($server, $metrics);

            // 7. Update server status
            $server->update([
                'status' => 'online',
                'last_seen_at' => now(),
            ]);

            Log::info('Metrics received successfully', [
                'server_id' => $server->id,
                'organization_id' => $organization->id,
                'metrics_count' => count($metrics),
                'machine_name' => $request->input('machine_name')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Metrics received successfully'
            ], 200, [
                'X-Configuration-Last-Update' => $server->monitoring_config_updated_at ?? now()->timestamp
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing metrics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'organization_id' => $organizationId,
                'server_id' => $serverId
            ]);

            return $this->errorResponse('INTERNAL_ERROR', 'Internal server error', null, 500);
        }
    }

    /**
     * Validate configuration changes
     * POST /api/{organization_id}/servers/{server_id}/config
     */
    public function validateConfig(Request $request, string $organizationId, string $serverId): JsonResponse
    {
        try {
            // 1. Authenticate probe
            $organization = $this->authenticateProbe($request, $organizationId);
            if (!$organization) {
                return $this->errorResponse('UNAUTHORIZED', 'Invalid authentication token', null, 401);
            }

            // 2. Find server
            $server = $organization->servers()->where('id', $serverId)->first();
            if (!$server) {
                return $this->errorResponse('NOT_FOUND', 'Server not found', null, 404);
            }

            // 3. Validate configuration structure
            $config = $request->all();
            $validationResult = $this->validateProbeConfig($config, $organization);

            if (!$validationResult['valid']) {
                return $this->errorResponse('INVALID_CONFIGURATION', 'Configuration validation failed', $validationResult['errors'], 422);
            }

            // 4. Check if config needs adjustment for plan limits
            $adjustedConfig = $this->adjustConfigForPlan($config, $organization);
            if ($adjustedConfig['adjusted']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Configuration adjusted for plan limits',
                    'config' => $adjustedConfig['config'],
                    'adjustments' => $adjustedConfig['adjustments']
                ], 205);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Configuration is valid'
            ]);

        } catch (\Exception $e) {
            Log::error('Error validating config', [
                'error' => $e->getMessage(),
                'organization_id' => $organizationId,
                'server_id' => $serverId
            ]);

            return $this->errorResponse('INTERNAL_ERROR', 'Internal server error', null, 500);
        }
    }

    /**
     * Get current server configuration
     * GET /api/{organization_id}/servers/{server_id}/config
     */
    public function getConfig(Request $request, string $organizationId, string $serverId): JsonResponse
    {
        try {
            // 1. Authenticate probe
            $organization = $this->authenticateProbe($request, $organizationId);
            if (!$organization) {
                return $this->errorResponse('UNAUTHORIZED', 'Invalid authentication token', null, 401);
            }

            // 2. Find server
            $server = $organization->servers()->where('id', $serverId)->first();
            if (!$server) {
                return $this->errorResponse('NOT_FOUND', 'Server not found', null, 404);
            }

            // 3. Generate configuration
            $config = $this->generateProbeConfig($server, $organization);

            return response()->json($config);

        } catch (\Exception $e) {
            Log::error('Error retrieving config', [
                'error' => $e->getMessage(),
                'organization_id' => $organizationId,
                'server_id' => $serverId
            ]);

            return $this->errorResponse('INTERNAL_ERROR', 'Internal server error', null, 500);
        }
    }

    /**
     * Authenticate probe using Bearer token
     */
    private function authenticateProbe(Request $request, string $organizationId): ?Organization
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $applicationToken = substr($authHeader, 7);

        return Organization::where('id', $organizationId)
            ->where('api_key', $applicationToken)
            ->first();
    }

    /**
     * Find or create server for the organization
     */
    private function findOrCreateServer(Organization $organization, string $serverId, string $machineName): Server
    {
        $server = $organization->servers()->where('id', $serverId)->first();

        if (!$server) {
            $server = $organization->servers()->create([
                'id' => $serverId,
                'name' => $machineName,
                'hostname' => $machineName,
                'ip_address' => request()->ip(),
                'description' => 'Auto-created from Monitorly probe',
                'status' => 'online',
            ]);

            Log::info('Auto-created server from probe', [
                'server_id' => $server->id,
                'machine_name' => $machineName,
                'organization_id' => $organization->id
            ]);
        }

        return $server;
    }

    /**
     * Process system info metrics
     */
    private function processSystemInfoMetrics(Server $server, array $metrics): void
    {
        foreach ($metrics as $metric) {
            if ($metric['category'] === 'system' && $metric['name'] === 'system_info') {
                // Store system info in server model ONLY (no need to store in metrics table)
                $server->update(['system_info' => $metric['value']]);
            }
        }
    }

    /**
     * Process regular metrics
     */
    private function processRegularMetrics(Server $server, array $metrics): void
    {
        Log::info('Starting to process regular metrics', [
            'server_id' => $server->id,
            'metrics_count' => count($metrics)
        ]);

        $metricsToInsert = [];
        $lastMetrics = $server->last_metrics ?? [];
        $now = now();

        foreach ($metrics as $index => $metric) {
            Log::info("Processing metric {$index}", [
                'category' => $metric['category'] ?? 'MISSING',
                'name' => $metric['name'] ?? 'MISSING',
                'has_value' => isset($metric['value']),
                'timestamp' => $metric['timestamp'] ?? 'MISSING'
            ]);

            // Skip system_info metrics (they should be handled by system info endpoint)
            if (isset($metric['category'], $metric['name']) && 
                $metric['category'] === 'system' && $metric['name'] === 'system_info') {
                Log::info('Skipping system_info metric in regular metrics');
                continue;
            }

            // Store metric in database
            $metricsToInsert[] = [
                'server_id' => $server->id,
                'category' => $metric['category'],
                'name' => $metric['name'],
                'metadata' => $metric['metadata'] ?? null,
                'value' => $metric['value'],
                'timestamp' => Carbon::parse($metric['timestamp']),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Update last_metrics for quick access
            $lastMetrics["{$metric['category']}.{$metric['name']}"] = [
                'value' => is_array($metric['value']) ? $metric['value'] : (float) $metric['value'],
                'timestamp' => $metric['timestamp'],
                'metadata' => $metric['metadata'] ?? null,
            ];
        }

        Log::info('Metrics prepared for insertion', [
            'metrics_to_insert_count' => count($metricsToInsert),
            'last_metrics_keys' => array_keys($lastMetrics)
        ]);

        // Bulk insert metrics
        if (!empty($metricsToInsert)) {
            try {
                Metric::insert($metricsToInsert);
                Log::info('Metrics successfully inserted to database', [
                    'inserted_count' => count($metricsToInsert)
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to insert metrics to database', [
                    'error' => $e->getMessage(),
                    'metrics_count' => count($metricsToInsert)
                ]);
                throw $e;
            }
        } else {
            Log::warning('No metrics to insert');
        }

        // Update server's last_metrics
        $server->update(['last_metrics' => $lastMetrics]);
        Log::info('Server last_metrics updated');

        // Cleanup old metrics (keep last 30 days)
        $deletedCount = $server->metrics()
            ->where('timestamp', '<', now()->subDays(30))
            ->delete();
        
        if ($deletedCount > 0) {
            Log::info('Cleaned up old metrics', ['deleted_count' => $deletedCount]);
        }
    }

    /**
     * Validate probe configuration
     */
    private function validateProbeConfig(array $config, Organization $organization): array
    {
        $errors = [];

        // Validate required fields
        if (!isset($config['sender']['target'])) {
            $errors[] = 'sender.target is required';
        }

        if (!isset($config['api']['url'])) {
            $errors[] = 'api.url is required';
        } elseif (!filter_var($config['api']['url'], FILTER_VALIDATE_URL)) {
            $errors[] = 'api.url must be a valid URL';
        }

        // Validate collection intervals
        if (isset($config['collection'])) {
            foreach ($config['collection'] as $type => $settings) {
                if (isset($settings['interval'])) {
                    if (!$this->isValidInterval($settings['interval'])) {
                        $errors[] = "collection.{$type}.interval must be a valid duration (e.g., 30s, 1m)";
                    }
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Adjust configuration for plan limits
     */
    private function adjustConfigForPlan(array $config, Organization $organization): array
    {
        $plan = $organization->owner?->plan;
        $adjusted = false;
        $adjustments = [];
        $newConfig = $config;

        if (!$plan || $plan->name === 'Free') {
            // Free plan: minimum 60s intervals, max 10m send interval
            if (isset($config['sender']['send_interval'])) {
                $interval = $this->parseInterval($config['sender']['send_interval']);
                if ($interval < 600) { // 10 minutes
                    $newConfig['sender']['send_interval'] = '10m';
                    $adjustments[] = 'Send interval increased to 10m due to Free plan limits';
                    $adjusted = true;
                }
            }

            // Adjust collection intervals
            if (isset($config['collection'])) {
                foreach ($config['collection'] as $type => $settings) {
                    if (isset($settings['interval'])) {
                        $interval = $this->parseInterval($settings['interval']);
                        if ($interval < 60) { // 60 seconds minimum
                            $newConfig['collection'][$type]['interval'] = '60s';
                            $adjustments[] = "Collection interval for {$type} increased to 60s for Free plan";
                            $adjusted = true;
                        }
                    }
                }
            }
        }

        return [
            'adjusted' => $adjusted,
            'config' => $adjusted ? $newConfig : $config,
            'adjustments' => $adjustments
        ];
    }

    /**
     * Generate probe configuration
     */
    private function generateProbeConfig(Server $server, Organization $organization): array
    {
        return [
            'machine_name' => $server->name,
            'collection' => [
                'cpu' => ['enabled' => true, 'interval' => '30s'],
                'ram' => ['enabled' => true, 'interval' => '30s'],
                'disk' => ['enabled' => true, 'interval' => '60s'],
                'service' => ['enabled' => true, 'interval' => '60s'],
                'user_activity' => ['enabled' => true, 'interval' => '60s'],
                'login_failures' => ['enabled' => true, 'interval' => '60s'],
                'port' => ['enabled' => true, 'interval' => '60s'],
            ],
            'sender' => [
                'target' => 'api',
                'send_interval' => '5m'
            ],
            'api' => [
                'url' => config('app.url'),
                'organization_id' => $organization->id,
                'server_id' => $server->id,
                'application_token' => $organization->api_key,
                'encryption_key' => $organization->encryption_key
            ],
            'logging' => [
                'file_path' => 'logs/monitorly.log'
            ],
            'updates' => [
                'enabled' => true,
                'check_time' => '03:00',
                'retry_delay' => '1h'
            ]
        ];
    }

    /**
     * Check if interval format is valid
     */
    private function isValidInterval(string $interval): bool
    {
        return preg_match('/^\d+[smh]$/', $interval);
    }

    /**
     * Parse interval to seconds
     */
    private function parseInterval(string $interval): int
    {
        if (preg_match('/^(\d+)([smh])$/', $interval, $matches)) {
            $value = (int) $matches[1];
            $unit = $matches[2];

            return match ($unit) {
                's' => $value,
                'm' => $value * 60,
                'h' => $value * 3600,
                default => 0
            };
        }

        return 0;
    }

    /**
     * Format error response
     */
    private function errorResponse(string $code, string $message, ?array $details = null, int $status = 400): JsonResponse
    {
        $response = [
            'status' => 'error',
            'error' => [
                'code' => $code,
                'message' => $message
            ]
        ];

        if ($details) {
            $response['error']['details'] = $details;
        }

        return response()->json($response, $status);
    }
}