<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Server extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'hostname',
        'ip_address',
        // 'port',
        'description',
        'os',
        'status',
        'last_ping',
        'last_seen_at',
        'monitoring_token',
        'organization_id',
        'token',
        'monitoring_config',
        'monitoring_config_updated_at',
        'system_info',
        'last_metrics',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'last_metrics' => 'array',
        'system_info' => 'array',
        'monitoring_config' => 'array',
        'monitoring_config_updated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($server) {
            if (empty($server->token)) {
                $server->token = Str::random(64);
            }
        });
    }



    /**
     * Relation avec les métriques
     */
    public function metrics(): HasMany
    {
        return $this->hasMany(Metric::class);
    }

    /**
     * Récupérer les métriques récentes (dernières 24h)
     */
    public function recentMetrics(): HasMany
    {
        return $this->metrics()->where('timestamp', '>=', now()->subHours(24));
    }

    /**
     * Obtenir les métriques actuelles du serveur depuis last_metrics
     */
    public function getCurrentMetrics(): array
    {
        $lastMetrics = $this->last_metrics ?? [];

        return [
            'cpu_usage' => $this->getMetricValue($lastMetrics, 'system.cpu', 'usage_percent', 0),
            'memory_usage' => $this->getMetricValue($lastMetrics, 'system.ram', 'usage_percent', 0),
            'disk_usage' => $this->getMetricValue($lastMetrics, 'system.disk', 'usage_percent', 0),
            'services' => $this->getServicesStatus($lastMetrics),
            'user_activity' => $this->getUserActivityData($lastMetrics),
            'login_failures' => $this->getLoginFailuresData($lastMetrics),
            'ports' => $this->getPortsData($lastMetrics),
        ];
    }

    /**
     * Obtenir les informations système formatées selon PROBE.md
     */
    public function getFormattedSystemInfo(): array
    {
        $systemInfo = $this->system_info ?? [];

        return [
            'hostname' => $systemInfo['hostname'] ?? $this->hostname ?? $this->name ?? 'Unknown',
            'public_ip' => $systemInfo['public_ip'] ?? $this->ip_address ?? 'Unknown',
            'os' => $systemInfo['os'] ?? 'Unknown',
            'os_version' => $systemInfo['os_version'] ?? 'Unknown',
            'kernel_version' => $systemInfo['kernel_version'] ?? 'Unknown',
            'cpu' => [
                'name' => $systemInfo['cpu']['name'] ?? 'Unknown',
                'cores' => $systemInfo['cpu']['cores'] ?? 1,
                'frequency_mhz' => $systemInfo['cpu']['frequency_mhz'] ?? 0,
            ],
            'ram' => [
                'total_bytes' => $systemInfo['ram']['total_bytes'] ?? 0,
                'total_formatted' => isset($systemInfo['ram']['total_bytes']) && $systemInfo['ram']['total_bytes'] > 0 ?
                    $this->formatBytes($systemInfo['ram']['total_bytes']) : 'Unknown',
            ],
            'disks' => $this->getFormattedDisks($systemInfo['disks'] ?? []),
            'services' => $systemInfo['services'] ?? [],
            'last_boot_time' => $systemInfo['last_boot_time'] ?? null,
            'last_boot_formatted' => isset($systemInfo['last_boot_time']) ?
                date('Y-m-d H:i:s', $systemInfo['last_boot_time']) : 'Unknown',
        ];
    }

    /**
     * Obtenir la dernière métrique d'un type donné (PROBE.md compatible)
     */
    public function getLastMetric(string $category, string $name)
    {
        return $this->metrics()
            ->where('category', $category)
            ->where('name', $name)
            ->latest('timestamp')
            ->first();
    }

    /**
     * Get system info metrics (for PROBE.md compatibility)
     */
    public function getSystemInfoMetrics()
    {
        return $this->metrics()
            ->where('category', 'system')
            ->where('name', 'system_info')
            ->latest('timestamp')
            ->first();
    }

    /**
     * Générer la commande d'installation pour ce serveur
     */
    public function getInstallCommand(): string
    {
        $baseUrl = config('app.url');

        return "curl -sSL {$baseUrl}/install/{$this->token} | bash";
    }

    /**
     * Obtenir l'URL du script d'installation
     */
    public function getInstallScriptUrl(): string
    {
        $baseUrl = config('app.url');

        return "{$baseUrl}/install/{$this->token}";
    }

    /**
     * Vérifier si le serveur est en ligne (dernière activité < 10 minutes)
     */
    public function isOnline(): bool
    {
        return $this->status === 'online' &&
            $this->last_seen_at &&
            $this->last_seen_at->gt(now()->subMinutes(10));
    }

    /**
     * Vérifier si le serveur est considéré comme hors ligne
     */
    public function isOffline(): bool
    {
        if (!$this->last_seen_at) {
            return true;
        }

        return $this->last_seen_at->lt(now()->subMinutes(10));
    }

    /**
     * Régénérer le token du serveur
     */
    public function regenerateToken(): string
    {
        $newToken = Str::random(64);
        $this->update(['token' => $newToken]);
        return $newToken;
    }

    /**
     * Scope pour les serveurs actifs (considère online et warning comme actifs)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['online', 'warning']);
    }

    /**
     * Scope pour les serveurs en ligne
     */
    public function scopeOnline($query)
    {
        return $query->where('status', 'online');
    }

    /**
     * Scope pour les serveurs hors ligne
     */
    public function scopeOffline($query)
    {
        return $query->where('status', 'offline');
    }

    /**
     * Obtenir les métriques par catégorie
     */
    public function getMetricsByCategory(string $category): HasMany
    {
        return $this->metrics()->where('category', $category);
    }

    /**
     * Helper method to get metric value from last_metrics
     */
    private function getMetricValue(array $lastMetrics, string $key, string $field, $default = null)
    {
        if (isset($lastMetrics[$key]['value'][$field])) {
            return $lastMetrics[$key]['value'][$field];
        }
        
        if (isset($lastMetrics[$key]['value']) && is_numeric($lastMetrics[$key]['value'])) {
            return $lastMetrics[$key]['value'];
        }
        
        return $default;
    }

    /**
     * Get services status from last_metrics
     */
    private function getServicesStatus(array $lastMetrics): array
    {
        $services = [];
        
        foreach ($lastMetrics as $key => $metric) {
            if (str_starts_with($key, 'system.service') && isset($metric['metadata']['service_name'])) {
                $services[] = [
                    'name' => $metric['metadata']['service_name'],
                    'label' => $metric['metadata']['label'] ?? $metric['metadata']['service_name'],
                    'status' => $metric['value']['status'] ?? 'unknown',
                    'running' => $metric['value']['running'] ?? false,
                ];
            }
        }
        
        return $services;
    }

    /**
     * Get user activity data from last_metrics
     */
    private function getUserActivityData(array $lastMetrics): array
    {
        return $lastMetrics['system.user_activity']['value'] ?? [];
    }

    /**
     * Get login failures data from last_metrics
     */
    private function getLoginFailuresData(array $lastMetrics): array
    {
        return $lastMetrics['system.login_failures']['value'] ?? [];
    }

    /**
     * Get ports data from last_metrics
     */
    private function getPortsData(array $lastMetrics): array
    {
        return $lastMetrics['system.port']['value'] ?? [];
    }

    /**
     * Format disks information for display
     */
    private function getFormattedDisks(array $disks): array
    {
        $formattedDisks = [];
        
        foreach ($disks as $disk) {
            $formattedDisks[] = [
                'mountpoint' => $disk['mountpoint'] ?? 'Unknown',
                'label' => $disk['label'] ?? 'Unknown',
                'total_bytes' => $disk['total_bytes'] ?? 0,
                'total_formatted' => isset($disk['total_bytes']) && $disk['total_bytes'] > 0 ?
                    $this->formatBytes($disk['total_bytes']) : 'Unknown',
            ];
        }
        
        return $formattedDisks;
    }

    /**
     * Formater les bytes en format lisible
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $unitIndex = 0;
        $size = $bytes;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return round($size, 2) . ' ' . $units[$unitIndex];
    }

    /**
     * The organization that owns the server.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }
}
