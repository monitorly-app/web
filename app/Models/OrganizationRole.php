<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OrganizationRole extends Model
{
    use HasFactory;

    protected $table = 'organization_roles';

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Les utilisateurs qui ont ce rôle dans les organisations
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot('organization_id')
            ->withTimestamps();
    }

    /**
     * Les organisations qui utilisent ce rôle
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot('user_id')
            ->withTimestamps();
    }

    /**
     * Les permissions de ce rôle
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(OrganizationPermission::class, 'organization_role_permissions');
    }

    /**
     * Vérifier si le rôle a une permission spécifique
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions()->where('name', $permissionName)->exists();
    }

    /**
     * Vérifier si le rôle a au moins une des permissions données
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        return $this->permissions()->whereIn('name', $permissionNames)->exists();
    }

    /**
     * Ajouter une permission au rôle
     */
    public function givePermission(string $permissionName): void
    {
        $permission = OrganizationPermission::where('name', $permissionName)->first();
        if ($permission && !$this->hasPermission($permissionName)) {
            $this->permissions()->attach($permission->id);
        }
    }

    /**
     * Retirer une permission du rôle
     */
    public function revokePermission(string $permissionName): void
    {
        $permission = OrganizationPermission::where('name', $permissionName)->first();
        if ($permission) {
            $this->permissions()->detach($permission->id);
        }
    }

    /**
     * Synchroniser les permissions du rôle
     */
    public function syncPermissions(array $permissionIds): void
    {
        $this->permissions()->sync($permissionIds);
    }

    /**
     * Vérifier si c'est un rôle système (non modifiable)
     */
    public function isSystemRole(): bool
    {
        return in_array($this->name, ['Owner', 'Admin']);
    }
}
