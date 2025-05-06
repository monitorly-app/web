<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Les utilisateurs qui ont ce rôle dans les projets
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('project_id')
            ->withTimestamps();
    }

    /**
     * Les projets qui utilisent ce rôle
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withPivot('user_id')
            ->withTimestamps();
    }
}
