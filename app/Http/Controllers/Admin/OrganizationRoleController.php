<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationPermission;
use App\Models\OrganizationRole;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationRoleController extends Controller
{
    /**
     * Display a listing of organization roles.
     */
    public function index()
    {
        $roles = OrganizationRole::with(['permissions'])
            ->withCount(['users as members_count'])
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'members_count' => $role->members_count,
                    'permissions_count' => $role->permissions->count(),
                    'is_system' => $role->isSystemRole(),
                    'permissions' => $role->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'label' => $permission->label,
                            'category' => $permission->category,
                        ];
                    }),
                ];
            });

        $permissions = OrganizationPermission::all()
            ->groupBy('category')
            ->map(function ($categoryPermissions) {
                return $categoryPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'label' => $permission->label,
                        'description' => $permission->description,
                        'category' => $permission->category,
                        'is_system' => $permission->is_system,
                    ];
                });
            });

        return Inertia::render('Admin/Organizations/Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Show the form for creating a new organization role.
     */
    public function create()
    {
        $permissions = OrganizationPermission::all()
            ->groupBy('category')
            ->map(function ($categoryPermissions) {
                return $categoryPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'label' => $permission->label,
                        'description' => $permission->description,
                        'category' => $permission->category,
                        'is_system' => $permission->is_system,
                    ];
                });
            });

        return Inertia::render('Admin/Organizations/Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created organization role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:organization_roles',
            'description' => 'nullable|string|max:500',
            'permissions' => 'array',
            'permissions.*' => 'exists:organization_permissions,id',
        ]);

        $role = OrganizationRole::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
        ]);

        if (!empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return redirect()->route('admin.organization-roles.index')
            ->with('success', "Rôle '{$role->name}' créé avec succès.");
    }

    /**
     * Display the specified organization role.
     */
    public function show(OrganizationRole $organizationRole)
    {
        $role = [
            'id' => $organizationRole->id,
            'name' => $organizationRole->name,
            'description' => $organizationRole->description,
            'is_system' => $organizationRole->isSystemRole(),
            'permissions' => $organizationRole->permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'label' => $permission->label,
                    'description' => $permission->description,
                    'category' => $permission->category,
                ];
            }),
        ];

        $allPermissions = OrganizationPermission::all()
            ->groupBy('category')
            ->map(function ($categoryPermissions) {
                return $categoryPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'label' => $permission->label,
                        'description' => $permission->description,
                        'category' => $permission->category,
                        'is_system' => $permission->is_system,
                    ];
                });
            });

        return Inertia::render('Admin/Organizations/Roles/Show', [
            'role' => $role,
            'permissions' => $allPermissions,
        ]);
    }

    /**
     * Show the form for editing the specified organization role.
     */
    public function edit(OrganizationRole $organizationRole)
    {
        if ($organizationRole->isSystemRole()) {
            return redirect()->route('admin.organization-roles.index')
                ->with('error', "Le rôle '{$organizationRole->name}' est un rôle système et ne peut pas être modifié.");
        }

        $role = [
            'id' => $organizationRole->id,
            'name' => $organizationRole->name,
            'description' => $organizationRole->description,
            'is_system' => $organizationRole->isSystemRole(),
            'permissions' => $organizationRole->permissions->pluck('id')->toArray(),
        ];

        $permissions = OrganizationPermission::all()
            ->groupBy('category')
            ->map(function ($categoryPermissions) {
                return $categoryPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'label' => $permission->label,
                        'description' => $permission->description,
                        'category' => $permission->category,
                        'is_system' => $permission->is_system,
                    ];
                });
            });

        return Inertia::render('Admin/Organizations/Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified organization role in storage.
     */
    public function update(Request $request, OrganizationRole $organizationRole)
    {
        if ($organizationRole->isSystemRole()) {
            return redirect()->route('admin.organization-roles.index')
                ->with('error', "Le rôle '{$organizationRole->name}' est un rôle système et ne peut pas être modifié.");
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:organization_roles,name,' . $organizationRole->id,
            'description' => 'nullable|string|max:500',
            'permissions' => 'array',
            'permissions.*' => 'exists:organization_permissions,id',
        ]);

        $organizationRole->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
        ]);

        $organizationRole->permissions()->sync($validated['permissions'] ?? []);

        return redirect()->route('admin.organization-roles.index')
            ->with('success', "Rôle '{$organizationRole->name}' mis à jour avec succès.");
    }

    /**
     * Remove the specified organization role from storage.
     */
    public function destroy(OrganizationRole $organizationRole)
    {
        if ($organizationRole->isSystemRole()) {
            return redirect()->route('admin.organization-roles.index')
                ->with('error', "Le rôle '{$organizationRole->name}' est un rôle système et ne peut pas être supprimé.");
        }

        // Vérifier si le rôle est utilisé
        $membersCount = $organizationRole->users()->count();
        if ($membersCount > 0) {
            return redirect()->route('admin.organization-roles.index')
                ->with('error', "Le rôle '{$organizationRole->name}' ne peut pas être supprimé car il est assigné à {$membersCount} membre(s).");
        }

        $roleName = $organizationRole->name;
        $organizationRole->delete();

        return redirect()->route('admin.organization-roles.index')
            ->with('success', "Rôle '{$roleName}' supprimé avec succès.");
    }

    /**
     * Update permissions for system roles (Owner, Admin only)
     */
    public function updateSystemRolePermissions(Request $request, OrganizationRole $organizationRole)
    {
        if (!$organizationRole->isSystemRole()) {
            return redirect()->route('admin.organization-roles.index')
                ->with('error', "Cette action est réservée aux rôles système.");
        }

        $validated = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'exists:organization_permissions,id',
        ]);

        $organizationRole->permissions()->sync($validated['permissions'] ?? []);

        return redirect()->route('admin.organization-roles.index')
            ->with('success', "Permissions du rôle '{$organizationRole->name}' mises à jour avec succès.");
    }
}
