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
     * Obtenir les métriques actuelles du serveur
     */
    public function getCurrentMetrics(): array
    {
        $lastMetrics = $this->last_metrics ?? [];

        // Métriques de base depuis last_metrics
        $currentMetrics = [
            'cpu_usage' => $lastMetrics['system.cpu']['value'] ?? 0,
            'memory_usage' => $lastMetrics['system.ram']['value'] ?? 0,
            'disk_usage' => $lastMetrics['system.disk']['value'] ?? 0,
            'uptime' => $lastMetrics['system.uptime']['value'] ?? 0,
            'network_in' => $lastMetrics['system.network_in']['value'] ?? 0,
            'network_out' => $lastMetrics['system.network_out']['value'] ?? 0,
            'processes_count' => $lastMetrics['system.processes']['value'] ?? 0,
            'connections_count' => $lastMetrics['system.connections']['value'] ?? 0,
        ];

        // Load average depuis les métadonnées de disk (exemple)
        if (isset($lastMetrics['system.load']) && isset($lastMetrics['system.load']['metadata']['load_avg'])) {
            $currentMetrics['load_average'] = json_decode($lastMetrics['system.load']['metadata']['load_avg'], true) ?? [0, 0, 0];
        } else {
            $currentMetrics['load_average'] = [0, 0, 0];
        }

        return $currentMetrics;
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
            'total_memory_formatted' => isset($systemInfo['total_memory']) ?
                $this->formatBytes($systemInfo['total_memory']) : 'Unknown',
            'total_disk_formatted' => isset($systemInfo['total_disk']) ?
                $this->formatBytes($systemInfo['total_disk']) : 'Unknown',
            'hostname' => $systemInfo['hostname'] ?? $this->name,
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
     * Formater les bytes en format lisible
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $unitIndex = 0;
        $size = $bytes;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return round($size, 2) . ' ' . $units[$unitIndex];
    }
}
