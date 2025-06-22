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
        'value',
        'metadata',
        'timestamp',
    ];

    protected $casts = [
        'value' => 'float',
        'metadata' => 'array',
        'timestamp' => 'datetime',
    ];

    /**
     * Relation avec le serveur
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
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
}
