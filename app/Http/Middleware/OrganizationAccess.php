<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class OrganizationAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $organization = $request->route('organization');
        $user = $request->user();

        // Check if user has access to this organization
        $isMember = $organization->members()->where('user_id', $user->id)->exists();

        if (!$isMember && $organization->owner_id !== $user->id) {
            Log::warning('User does not have access to organization', [
                'userId' => $user->id,
                'organizationId' => $organization->id
            ]);
            abort(403, "You don't have access to this organization");
        }

        // Save the current organization ID in session
        session(['last_organization_id' => $organization->id]);

        return $next($request);
    }
}
