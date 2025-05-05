<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index()
    {
        $roles = Role::withCount('users')->get();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        return Inertia::render('Admin/Roles/Create');
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'description' => 'nullable|string',
        ]);

        Role::create($validated);

        return redirect()->route('roles.index')->with('success', 'Role created successfully.');
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role)
    {
        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role,
        ]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        // System roles (id <= 2) cannot be renamed
        if ($role->id <= 2) {
            $validated = $request->validate([
                'description' => 'nullable|string',
            ]);

            $role->update(['description' => $validated['description']]);
        } else {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
                'description' => 'nullable|string',
            ]);

            $role->update($validated);
        }

        return redirect()->route('roles.index')->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role)
    {
        // Prevent deletion of system roles (id <= 2) or roles with users
        if ($role->id <= 2 || $role->users()->count() > 0) {
            return redirect()->route('roles.index')->with('error', 'This role cannot be deleted.');
        }

        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted successfully.');
    }
}
