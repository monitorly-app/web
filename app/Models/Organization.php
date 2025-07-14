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
use App\Models\OrganizationInvitation;

class Organization extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'organizations';

    // IMPORTANT: These two lines are essential for UUID primary keys
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'logo',
        'owner_id',
        'description',
        'api_key',
        'encryption_key',
        'plan_id',
        'subscription_status',
        'organization_type',
        'billing_period',
        'billing_address',
        'tax_number',
    ];

    protected $casts = [
        'api_key_last_used_at' => 'datetime',
        'api_requests_reset_date' => 'date',
        'api_requests_count' => 'integer',
        'billing_address' => 'array',
    ];

    protected $hidden = [
        'encryption_key',
    ];

    /**
     * Relation with the organization owner
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Relation with the organization members
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot('organization_role_id')
            ->withTimestamps();
    }

    /**
     * Alias pour members() - relation avec tous les utilisateurs de l'organisation
     */
    public function users(): BelongsToMany
    {
        return $this->members();
    }

    /**
     * Relation with the organization servers
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'organization_id');
    }

    /**
     * Relation with the organization invitations
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class, 'organization_id');
    }

    /**
     * Relation with the organization plan
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Check if a user is a member of the organization
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists() || $this->owner_id === $user->id;
    }

    /**
     * Check if a user is an admin of the organization
     */
    public function isAdmin(User $user): bool
    {
        return $this->owner_id === $user->id ||
            $this->members()
            ->where('user_id', $user->id)
            ->whereIn('organization_role_id', [1, 2]) // Owner ou Admin roles
            ->exists();
    }

    /**
     * Générer une nouvelle clé API
     */
    public function regenerateApiKey(): string
    {
        $newApiKey = 'org_' . Str::random(32);
        $this->update([
            'api_key' => $newApiKey,
            'api_requests_count' => 0, // Reset le compteur
            'api_requests_reset_date' => now()->toDateString(),
            'api_key_last_used_at' => null, // Reset last used
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
        $apiKey = 'org_' . Str::random(32);
        $encryptionKey = Str::random(64);

        $this->update([
            'api_key' => $apiKey,
            'encryption_key' => $encryptionKey,
            'api_requests_count' => 0,
            'api_requests_reset_date' => now()->toDateString(),
            'api_key_last_used_at' => null,
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
        if ($this->api_requests_reset_date && $this->api_requests_reset_date->month !== now()->month) {
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
        // Estimation basée sur la fréquence et le nombre de serveurs max
        return match ($plan->name) {
            'Free' => 50000,    // ~1 serveur * 1440 req/jour * 30 jours
            'Pro' => 500000,    // ~10 serveurs * 1440 req/jour * 30 jours  
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
            'requests_this_month' => $this->api_requests_count ?? 0,
            'monthly_limit' => $limit,
            'limit_percentage' => $limit === -1 ? 0 : (($this->api_requests_count ?? 0) / $limit) * 100,
            'last_used' => $this->api_key_last_used_at?->format('c'),
            'reset_date' => $this->api_requests_reset_date?->format('c') ?? now()->format('c'),
        ];
    }

    /**
     * Déchiffrer des données avec la clé de l'organisation
     */
    public function decryptData(string $encryptedData): ?array
    {
        try {
            $iv = substr(hash('sha256', $this->encryption_key), 0, 16);

            $decrypted = openssl_decrypt(
                base64_decode($encryptedData),
                'AES-256-CBC',
                $this->encryption_key,
                0,
                $iv
            );

            return $decrypted ? json_decode($decrypted, true) : null;
        } catch (\Exception $e) {
            Log::error('Decryption failed for organization ' . $this->id . ': ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Chiffrer des données avec la clé de l'organisation (pour les tests)
     */
    public function encryptData(array $data): string
    {
        $json = json_encode($data);
        $iv = substr(hash('sha256', $this->encryption_key), 0, 16);

        $encrypted = openssl_encrypt(
            $json,
            'AES-256-CBC',
            $this->encryption_key,
            0,
            $iv
        );

        return base64_encode($encrypted);
    }

    /**
     * Obtenir les statistiques de l'organisation
     */
    public function getOrganizationStats(): array
    {
        $servers = $this->servers()->active();

        return [
            'total_servers' => $servers->count(),
            'online_servers' => $servers->online()->count(),
            'offline_servers' => $servers->offline()->count(),
            'warning_servers' => $servers->where('status', 'warning')->count(),
            'total_members' => $this->members()->count() + 1, // +1 pour l'owner
        ];
    }

    /**
     * Check if organization is in trial (always false - no trial system)
     */
    public function isInTrial(): bool
    {
        return false;
    }

    /**
     * Check if trial has expired (always false - no trial system)
     */
    public function isTrialExpired(): bool
    {
        return false;
    }

    /**
     * Check if organization has active subscription
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscription_status === 'active';
    }

    /**
     * Get days remaining in trial (always 0 - no trial system)
     */
    public function getTrialDaysRemaining(): int
    {
        return 0;
    }

    /**
     * Check if organization can use features based on plan
     */
    public function canUseFeature(string $feature): bool
    {
        $plan = $this->plan;
        if (!$plan) {
            return false;
        }

        // Vérifier selon le plan (Free plan est toujours actif, pas de trial)
        return match ($feature) {
            'multiple_servers' => $plan->max_servers > 1 || $plan->max_servers === -1,
            'advanced_metrics' => in_array($plan->name, ['Pro', 'Business']),
            'api_access' => in_array($plan->name, ['Pro', 'Business']),
            'priority_support' => $plan->name === 'Business',
            default => true,
        };
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($organization) {
            if (!$organization->api_key) {
                $organization->api_key = 'org_' . Str::random(32);
            }
            if (!$organization->encryption_key) {
                $organization->encryption_key = Str::random(64);
            }
            // Initialiser les compteurs
            $organization->api_requests_count = 0;
            $organization->api_requests_reset_date = now()->toDateString();
        });
    }
}
