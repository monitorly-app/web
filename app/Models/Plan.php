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
        'description',
    ];

    /**
     * Get the users associated with the plan.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
