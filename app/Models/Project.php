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

    // IMPORTANT: These two lines are essential for UUID primary keys
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'owner_id',
        'description',
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
}
