<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasFactory, HasUuids;

    // IMPORTANT: These two lines are essential for UUID primary keys
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'owner_id',
        'description',
        'api_key',
        'encryption_key',
    ];

    protected $casts = [
        'api_key_last_used_at' => 'datetime',
        'api_requests_reset_date' => 'date',
    ];

    protected $hidden = [
        'encryption_key',
    ];


    /**
     * Relation with the project owner
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }


    /**
     * Relation with the project members
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('project_role_id')
            ->withTimestamps();
    }

    /**
     * Check if a user is a member of the project
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists() || $this->owner_id === $user->id;
    }

    /**
     * Check if a user is an admin of the project
     */
    public function isAdmin(User $user): bool
    {
        return $this->owner_id === $user->id ||
            $this->members()
            ->where('user_id', $user->id)
            ->where('project_role_id', 1) // Assuming 1 is admin role
            ->exists();
    }

    /**
     * Relation with the project servers
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }

    /**
     * Générer une nouvelle clé API
     */
    public function regenerateApiKey(): string
    {
        $newApiKey = 'proj_' . Str::random(32);
        $this->update([
            'api_key' => $newApiKey,
            'api_requests_count' => 0, // Reset le compteur
            'api_requests_reset_date' => now()->toDateString(),
        ]);
        return $newApiKey;
    }

    /**
     * Générer une nouvelle clé de chiffrement
     */
    public function regenerateEncryptionKey(): string
    {
        $newEncryptionKey = Str::random(64);
        $this->update(['encryption_key' => $newEncryptionKey]);
        return $newEncryptionKey;
    }

    /**
     * Régénérer les deux clés en même temps
     */
    public function regenerateAllKeys(): array
    {
        $apiKey = 'proj_' . Str::random(32);
        $encryptionKey = Str::random(64);

        $this->update([
            'api_key' => $apiKey,
            'encryption_key' => $encryptionKey,
            'api_requests_count' => 0,
            'api_requests_reset_date' => now()->toDateString(),
        ]);

        return [
            'api_key' => $apiKey,
            'encryption_key' => $encryptionKey,
        ];
    }

    /**
     * Vérifier si la clé API est valide et mettre à jour les stats
     */
    public function validateApiKey(string $apiKey): bool
    {
        if ($this->api_key !== $apiKey) {
            return false;
        }

        // Mettre à jour les statistiques d'usage
        $this->increment('api_requests_count');
        $this->update(['api_key_last_used_at' => now()]);

        return true;
    }

    /**
     * Vérifier les limites du plan pour les requêtes API
     */
    public function canMakeApiRequest(): bool
    {
        $owner = $this->owner;
        if (!$owner || !$owner->plan) {
            return false;
        }

        // Reset le compteur si on change de mois
        if ($this->api_requests_reset_date->month !== now()->month) {
            $this->update([
                'api_requests_count' => 0,
                'api_requests_reset_date' => now()->toDateString(),
            ]);
        }

        // Vérifier les limites selon le plan
        $plan = $owner->plan;
        $monthlyLimit = $this->getApiRequestsLimit($plan);

        return $monthlyLimit === -1 || $this->api_requests_count < $monthlyLimit;
    }

    /**
     * Obtenir la limite de requêtes API selon le plan
     */
    private function getApiRequestsLimit($plan): int
    {
        // Estimation basée sur la fréquence et le nombre de serveurs
        return match ($plan->name) {
            'Free' => 50000,    // ~1 serveur * 1440 min/jour * 30 jours = 43200
            'Pro' => 500000,    // ~10 serveurs * 96 req/jour * 30 jours = 28800 par serveur
            'Business' => -1,   // Illimité
            default => 10000,
        };
    }

    /**
     * Obtenir les statistiques d'usage de l'API
     */
    public function getApiUsageStats(): array
    {
        $owner = $this->owner;
        $plan = $owner?->plan;
        $limit = $this->getApiRequestsLimit($plan);

        return [
            'requests_this_month' => $this->api_requests_count,
            'monthly_limit' => $limit,
            'limit_percentage' => $limit === -1 ? 0 : ($this->api_requests_count / $limit) * 100,
            'last_used' => $this->api_key_last_used_at?->toISOString(),
            'reset_date' => $this->api_requests_reset_date->toISOString(),
        ];
    }

    /**
     * Déchiffrer des données avec la clé du projet
     */
    public function decryptData(string $encryptedData): ?array
    {
        try {
            // Utiliser la clé de chiffrement pour déchiffrer
            // TODO: Implémenter le déchiffrement selon l'algo choisi
            $decrypted = openssl_decrypt(
                base64_decode($encryptedData),
                'AES-256-CBC',
                $this->encryption_key,
                0,
                substr(hash('sha256', $this->encryption_key), 0, 16)
            );

            return $decrypted ? json_decode($decrypted, true) : null;
        } catch (\Exception $e) {
            Log::error('Decryption failed for project ' . $this->id . ': ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Chiffrer des données avec la clé du projet (pour les tests)
     */
    public function encryptData(array $data): string
    {
        $json = json_encode($data);
        $encrypted = openssl_encrypt(
            $json,
            'AES-256-CBC',
            $this->encryption_key,
            0,
            substr(hash('sha256', $this->encryption_key), 0, 16)
        );

        return base64_encode($encrypted);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($project) {
            if (!$project->api_key) {
                $project->api_key = 'proj_' . Str::random(32);
            }
            if (!$project->encryption_key) {
                $project->encryption_key = Str::random(64);
            }
        });
    }
}
