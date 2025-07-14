<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    /**
     * Display a listing of organizations for supervision.
     */
    public function index(Request $request)
    {
        $query = Organization::query()
            ->with(['owner', 'plan'])
            ->withCount(['servers', 'members'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('subscription_status', $status);
            });

        $totalCount = $query->count();
        $organizations = $query->latest()->paginate(15);
        
        // Add total count to meta
        $organizations->getCollection()->transform(function ($org) {
            return $org;
        });
        
        $organizations = $organizations->toArray();
        $organizations['meta']['total'] = $totalCount;

        return Inertia::render('Admin/Organizations/Index', [
            'organizations' => $organizations,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    /**
     * Display organization details for supervision.
     */
    public function show(Organization $organization)
    {
        $organization->load([
            'owner',
            'plan',
            'servers' => function ($query) {
                $query->latest()->take(10);
            },
            'members.role'
        ]);

        $stats = [
            'servers_count' => $organization->servers()->count(),
            'members_count' => $organization->members()->count(),
            'api_requests_count' => $organization->api_requests_count,
            'api_key_last_used_at' => $organization->api_key_last_used_at,
        ];

        return Inertia::render('Admin/Organizations/Show', [
            'organization' => $organization,
            'stats' => $stats,
        ]);
    }

    /**
     * Suspend an organization.
     */
    public function suspend(Organization $organization)
    {
        $organization->update(['subscription_status' => 'suspended']);

        return redirect()->back()->with('success', 'Organization suspended successfully.');
    }

    /**
     * Reactivate a suspended organization.
     */
    public function reactivate(Organization $organization)
    {
        $organization->update(['subscription_status' => 'active']);

        return redirect()->back()->with('success', 'Organization reactivated successfully.');
    }

    /**
     * Regenerate API key for organization (support function).
     */
    public function regenerateApiKey(Organization $organization)
    {
        $organization->update([
            'api_key' => Str::random(64),
            'api_key_last_used_at' => null,
            'api_requests_count' => 0,
        ]);

        return redirect()->back()->with('success', 'API key regenerated successfully.');
    }

    /**
     * View organization members (supervision).
     */
    public function members(Organization $organization)
    {
        $members = $organization->members()
            ->with(['role'])
            ->get();

        return Inertia::render('Admin/Organizations/Members', [
            'organization' => $organization,
            'members' => $members,
        ]);
    }

    /**
     * View organization servers (supervision).
     */
    public function servers(Organization $organization)
    {
        $query = $organization->servers()->withCount('metrics');
        $totalCount = $query->count();
        $servers = $query->latest()->paginate(20);
        
        // Add total count to meta
        $servers = $servers->toArray();
        $servers['meta']['total'] = $totalCount;

        return Inertia::render('Admin/Organizations/Servers', [
            'organization' => $organization,
            'servers' => $servers,
        ]);
    }

    /**
     * Export organizations data for analysis.
     */
    public function export()
    {
        $organizations = Organization::with(['owner', 'plan'])
            ->withCount(['servers', 'members'])
            ->get();

        $csv = "ID,Name,Owner,Email,Plan,Status,Servers,Members,API Requests,Created At\n";
        
        foreach ($organizations as $org) {
            $csv .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%d,\"%s\"\n",
                $org->id,
                $org->name,
                $org->owner->name,
                $org->owner->email,
                $org->plan->name ?? 'No Plan',
                $org->subscription_status,
                $org->servers_count,
                $org->members_count,
                $org->api_requests_count,
                $org->created_at
            );
        }

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="organizations_' . now()->format('Y-m-d') . '.csv"');
    }

    /**
     * Get organization stats for dashboard.
     */
    public function stats()
    {
        $stats = [
            'total' => Organization::count(),
            'active' => Organization::where('subscription_status', 'active')->count(),
            'suspended' => Organization::where('subscription_status', 'suspended')->count(),
            'cancelled' => Organization::where('subscription_status', 'cancelled')->count(),
            'total_servers' => \App\Models\Server::count(),
            'total_api_requests' => Organization::sum('api_requests_count'),
        ];

        return response()->json($stats);
    }
}