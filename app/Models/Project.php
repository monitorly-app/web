<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Project extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'id',
        'name',
        'owner_id',
        'plan_id',
        'description',
    ];

    /**
     * Relation avec le propriétaire du projet
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Relation avec le plan du projet
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Relation avec les membres du projet
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('project_role_id')
            ->withTimestamps();
    }

    /**
     * Vérifier si un utilisateur est membre du projet
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists() || $this->owner_id === $user->id;
    }

    /**
     * Vérifier si un utilisateur est administrateur du projet
     */
    public function isAdmin(User $user): bool
    {
        return $this->owner_id === $user->id ||
            $this->members()
            ->where('user_id', $user->id)
            ->where('project_role_id', 1) // Assuming 1 is admin role
            ->exists();
    }
}
