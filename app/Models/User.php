<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'role_id',
        // 'plan_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the role associated with the user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }


    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role_id === 1; // Assuming 1 is the admin role ID
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        return $this->role && $this->role->hasPermission($permission);
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return $this->role && $this->role->hasAnyPermission($permissions);
    }

    /**
     * Check if user can perform a specific action
     */
    public function canPerform(string $permission): bool
    {
        return $this->hasPermission($permission);
    }

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute(): string
    {
        if ($this->first_name && $this->last_name) {
            return "{$this->first_name} {$this->last_name}";
        }

        return $this->name;
    }

    /**
     * Organisations dont l'utilisateur est propriétaire
     */
    public function ownedOrganizations()
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    /**
     * Toutes les organisations auxquelles l'utilisateur a accès
     * (y compris celles dont il est propriétaire et celles dont il est membre)
     */
    public function organizations()
    {
        // Récupérer les organisations possédées
        $ownedOrganizations = $this->ownedOrganizations()->get();

        // Récupérer les organisations où l'utilisateur est membre
        $memberOrganizations = $this->memberOrganizations()->get();

        // Fusionner les deux collections et supprimer les doublons
        return $ownedOrganizations->merge($memberOrganizations)->unique('id');
    }

    /**
     * Organisations dont l'utilisateur est membre
     */
    public function memberOrganizations()
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot('organization_role_id')
            ->withTimestamps();
    }
}
