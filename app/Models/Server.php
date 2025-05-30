<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Server extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

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
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'last_metrics' => 'array',
        'system_info' => 'array',
        'is_active' => 'boolean',
        'port' => 'integer',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Générer automatiquement un token unique lors de la création
        static::creating(function ($server) {
            if (!$server->token) {
                $server->token = 'srv_' . Str::random(32);
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
     * Vérifier si le serveur est en ligne
     */
    public function isOnline(): bool
    {
        return $this->status === 'online' &&
            $this->last_seen_at &&
            $this->last_seen_at->diffInMinutes(now()) <= 5; // 5 minutes de tolérance
    }

    /**
     * Vérifier si le serveur est hors ligne
     */
    public function isOffline(): bool
    {
        return $this->status === 'offline' ||
            !$this->last_seen_at ||
            $this->last_seen_at->diffInMinutes(now()) > 10; // 10 minutes = hors ligne
    }

    /**
     * Obtenir le statut formaté avec couleur
     */
    public function getStatusBadge(): array
    {
        return match ($this->status) {
            'online' => ['label' => 'Online', 'color' => 'green'],
            'warning' => ['label' => 'Warning', 'color' => 'yellow'],
            'offline' => ['label' => 'Offline', 'color' => 'red'],
            'error' => ['label' => 'Error', 'color' => 'red'],
            'pending' => ['label' => 'Pending', 'color' => 'gray'],
            default => ['label' => 'Unknown', 'color' => 'gray'],
        };
    }

    /**
     * Obtenir les métriques actuelles avec valeurs par défaut
     */
    public function getCurrentMetrics(): array
    {
        $defaultMetrics = [
            'cpu_usage' => 0,
            'memory_usage' => 0,
            'disk_usage' => 0,
            'network_in' => 0,
            'network_out' => 0,
            'load_average' => [0, 0, 0],
            'uptime' => 0,
        ];

        return array_merge($defaultMetrics, $this->last_metrics ?? []);
    }

    /**
     * Mettre à jour les métriques du serveur
     */
    public function updateMetrics(array $metrics): void
    {
        $this->update([
            'last_metrics' => $metrics,
            'last_seen_at' => now(),
            'status' => $this->determineStatusFromMetrics($metrics),
        ]);
    }

    /**
     * Déterminer le statut en fonction des métriques
     */
    private function determineStatusFromMetrics(array $metrics): string
    {
        // Si CPU > 90% ou Mémoire > 95% ou Disque > 95% = warning
        if (
            ($metrics['cpu_usage'] ?? 0) > 90 ||
            ($metrics['memory_usage'] ?? 0) > 95 ||
            ($metrics['disk_usage'] ?? 0) > 95
        ) {
            return 'warning';
        }

        return 'online';
    }

    /**
     * Obtenir les informations système formatées
     */
    public function getFormattedSystemInfo(): array
    {
        $defaultInfo = [
            'os' => 'Unknown',
            'kernel' => 'Unknown',
            'cpu_model' => 'Unknown',
            'cpu_cores' => 0,
            'total_memory' => 0,
            'total_disk' => 0,
        ];

        return array_merge($defaultInfo, $this->system_info ?? []);
    }

    /**
     * Générer un nouveau token
     */
    public function regenerateToken(): string
    {
        $newToken = 'srv_' . Str::random(32);
        $this->update(['token' => $newToken]);
        return $newToken;
    }

    /**
     * Obtenir la commande d'installation de l'agent
     */
    public function getInstallCommand(): string
    {
        $baseUrl = config('app.url');
        return "curl -sSL {$baseUrl}/agent/install.sh | bash -s -- {$this->token}";
    }

    /**
     * Scope pour les serveurs actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour les serveurs en ligne
     */
    public function scopeOnline($query)
    {
        return $query->where('status', 'online')
            ->where('last_seen_at', '>=', now()->subMinutes(5));
    }

    /**
     * Scope pour les serveurs hors ligne
     */
    public function scopeOffline($query)
    {
        return $query->where(function ($q) {
            $q->where('status', 'offline')
                ->orWhere('last_seen_at', '<', now()->subMinutes(10))
                ->orWhereNull('last_seen_at');
        });
    }
}
