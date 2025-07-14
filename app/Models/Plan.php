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
        'slug',
        'description',
        'price',
        'frequency',
        'max_servers',
        'max_users',
        'max_organizations',
        'max_metrics',
        'max_alerts',
        'features',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
        'price' => 'array',
    ];

    /**
     * Get the organizations for the plan.
     */
    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
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

    /**
     * Get monthly price
     */
    public function getMonthlyPrice(): float
    {
        return $this->price['monthly'] ?? 0;
    }

    /**
     * Get yearly price
     */
    public function getYearlyPrice(): float
    {
        return $this->price['yearly'] ?? 0;
    }

    /**
     * Get savings percentage when choosing yearly
     */
    public function getYearlySavings(): float
    {
        $monthly = $this->getMonthlyPrice();
        $yearly = $this->getYearlyPrice();

        if ($monthly == 0 || $yearly == 0) {
            return 0;
        }

        $yearlyEquivalent = $monthly * 12;
        return round((($yearlyEquivalent - $yearly) / $yearlyEquivalent) * 100);
    }
}
