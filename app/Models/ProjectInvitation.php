<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'email',
        'project_role_id',
        'token',
        'status',
    ];

    /**
     * The project this invitation belongs to.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * The role this invitation grants.
     */
    public function role()
    {
        return $this->belongsTo(ProjectRole::class, 'project_role_id');
    }
}
