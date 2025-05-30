<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'price',
        'frequency',
        'max_servers',
        'max_users',
        'max_projects',
        'max_metrics',
        'max_alerts',
        'description',
    ];

    /**
     * Get the users associated with the plan.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if a resource limit is unlimited
     */
    public function isUnlimited(string $resource): bool
    {
        $field = "max_{$resource}";
        return $this->$field === -1;
    }

    /**
     * Get formatted limit text
     */
    public function getFormattedLimit(string $resource): string
    {
        $field = "max_{$resource}";
        $value = $this->$field;

        if ($value === -1) {
            return 'Unlimited';
        }

        return number_format($value);
    }

    /**
     * Check if user can create more of a resource
     */
    public function canCreate(string $resource, int $currentCount): bool
    {
        $field = "max_{$resource}";
        $limit = $this->$field;

        return $limit === -1 || $currentCount < $limit;
    }
}
