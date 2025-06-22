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
        'project_id',
        'name',
        'host',
        'port',
        'description',
        'token',
        'status',
        'last_seen_at',
        'last_metrics',
        'agent_version',
        'system_info',
        'is_active',
        'boot_time',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_seen_at' => 'datetime',
        'last_metrics' => 'array',
        'system_info' => 'array',
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
     * Relation avec le projet
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
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
     * Récupérer les métriques actuelles (dernières valeurs connues)
     */
    public function getCurrentMetrics(): array
    {
        // Récupérer la dernière métrique de chaque type
        $cpuMetric = $this->getLastMetric('system', 'cpu');
        $ramMetric = $this->getLastMetric('system', 'ram');
        $diskMetric = $this->getLastMetric('system', 'disk');
        $uptimeMetric = $this->getLastMetric('system', 'uptime');
        $loadMetric = $this->getLastMetric('system', 'load_average');
        $networkInMetric = $this->getLastMetric('network', 'bytes_recv');
        $networkOutMetric = $this->getLastMetric('network', 'bytes_sent');
        $processesMetric = $this->getLastMetric('system', 'processes');
        $connectionsMetric = $this->getLastMetric('network', 'connections');

        return [
            'cpu_usage' => $cpuMetric ? $cpuMetric->value : 0,
            'memory_usage' => $ramMetric ? $ramMetric->value : 0,
            'disk_usage' => $diskMetric ? $diskMetric->value : 0,
            'uptime' => $uptimeMetric ? $uptimeMetric->value : 0,
            'load_average' => $loadMetric && isset($loadMetric->metadata['load_avg']) ?
                json_decode($loadMetric->metadata['load_avg'], true) : [0, 0, 0],
            'network_in' => $networkInMetric ? $networkInMetric->value : 0,
            'network_out' => $networkOutMetric ? $networkOutMetric->value : 0,
            'processes_count' => $processesMetric ? $processesMetric->value : 0,
            'connections_count' => $connectionsMetric ? $connectionsMetric->value : 0,
        ];
    }

    /**
     * Obtenir la dernière métrique d'un type donné
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
     * Obtenir les informations système formatées
     */
    public function getFormattedSystemInfo(): array
    {
        $systemInfo = $this->system_info ?? [];

        return [
            'os' => $systemInfo['os'] ?? 'Unknown',
            'kernel' => $systemInfo['kernel'] ?? 'Unknown',
            'cpu_model' => $systemInfo['cpu_model'] ?? 'Unknown',
            'cpu_cores' => $systemInfo['cpu_cores'] ?? 0,
            'total_memory' => $systemInfo['total_memory'] ?? 0,
            'total_disk' => $systemInfo['total_disk'] ?? 0,
            'total_memory_formatted' => isset($systemInfo['total_memory']) ? $this->formatBytes($systemInfo['total_memory']) : 'Unknown',
            'total_disk_formatted' => isset($systemInfo['total_disk']) ? $this->formatBytes($systemInfo['total_disk']) : 'Unknown',
            'hostname' => $systemInfo['hostname'] ?? $this->name,
        ];
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
     * Vérifier si le serveur est hors ligne
     */
    public function isOffline(): bool
    {
        return $this->status === 'offline' ||
            !$this->last_seen_at ||
            $this->last_seen_at->lt(now()->subMinutes(10));
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
     * Scope pour les serveurs actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Obtenir les métriques par catégorie
     */
    public function getMetricsByCategory(string $category): HasMany
    {
        return $this->metrics()->where('category', $category);
    }

    /**
     * Formater les bytes en unités lisibles
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $unitIndex = floor(log($bytes, 1024));

        return round($bytes / pow(1024, $unitIndex), 2) . ' ' . $units[$unitIndex];
    }
}
