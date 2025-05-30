<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ProjectAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $project = $request->route('project');
        $user = $request->user();

        // Check if user has access to this project
        $isMember = $project->members()->where('user_id', $user->id)->exists();

        if (!$isMember && $project->owner_id !== $user->id) {
            Log::warning('User does not have access to project', [
                'userId' => $user->id,
                'projectId' => $project->id
            ]);
            abort(403, "You don't have access to this project");
        }

        // Save the current project ID in session
        session(['last_project_id' => $project->id]);

        return $next($request);
    }
}
