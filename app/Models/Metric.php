<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Metric extends Model
{
    use HasFactory;

    protected $fillable = [
        'server_id',
        'category',
        'name',
        'metadata',
        'value',
        'timestamp',
    ];

    protected $casts = [
        'metadata' => 'array',
        'value' => 'array', // Can be array or scalar, Laravel will handle appropriately
        'timestamp' => 'datetime',
    ];

    /**
     * Constants for metric categories as defined in PROBE.md
     */
    const CATEGORY_SYSTEM = 'system';

    /**
     * Constants for metric names as defined in PROBE.md
     */
    const NAME_CPU = 'cpu';
    const NAME_RAM = 'ram';
    const NAME_DISK = 'disk';
    const NAME_SERVICE = 'service';
    const NAME_USER_ACTIVITY = 'user_activity';
    const NAME_LOGIN_FAILURES = 'login_failures';
    const NAME_PORT = 'port';
    const NAME_SYSTEM_INFO = 'system_info';

    /**
     * Relation avec le serveur
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Get organization through server relationship
     */
    public function organization()
    {
        return $this->hasOneThrough(Organization::class, Server::class, 'id', 'id', 'server_id', 'organization_id');
    }

    /**
     * Scope pour filtrer par catégorie
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope pour filtrer par nom de métrique
     */
    public function scopeName($query, string $name)
    {
        return $query->where('name', $name);
    }

    /**
     * Scope pour filtrer par catégorie et nom
     */
    public function scopeType($query, string $category, string $name)
    {
        return $query->where('category', $category)->where('name', $name);
    }

    /**
     * Scope pour les métriques récentes
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('timestamp', '>=', now()->subHours($hours));
    }

    /**
     * Scope pour une période donnée
     */
    public function scopeBetween($query, $start, $end)
    {
        return $query->whereBetween('timestamp', [$start, $end]);
    }

    /**
     * Scope pour les métriques système
     */
    public function scopeSystem($query)
    {
        return $query->where('category', self::CATEGORY_SYSTEM);
    }

    /**
     * Get numeric value from metric value
     */
    public function getNumericValue(): float
    {
        if (is_numeric($this->value)) {
            return (float) $this->value;
        }

        if (is_array($this->value)) {
            // Try common numeric fields
            if (isset($this->value['usage_percent'])) {
                return (float) $this->value['usage_percent'];
            }
            if (isset($this->value['percent'])) {
                return (float) $this->value['percent'];
            }
            if (isset($this->value['value'])) {
                return (float) $this->value['value'];
            }
        }

        return 0.0;
    }

    /**
     * Check if this is a system info metric
     */
    public function isSystemInfo(): bool
    {
        return $this->category === self::CATEGORY_SYSTEM && $this->name === self::NAME_SYSTEM_INFO;
    }
}
