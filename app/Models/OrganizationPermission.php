<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OrganizationPermission extends Model
{
    use HasFactory;

    protected $table = 'organization_permissions';

    protected $fillable = [
        'name',
        'label',
        'description',
        'category',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * Les rôles qui ont cette permission
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(OrganizationRole::class, 'organization_role_permissions');
    }

    /**
     * Scope pour récupérer seulement les permissions non-système
     */
    public function scopeUserDefined($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope pour récupérer les permissions par catégorie
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
