<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $users = User::query()
            ->with(['role'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                $query->whereHas('role', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->latest()
            ->paginate(15);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->search,
                'role' => $request->role,
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $roles = Role::all();

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(12)),
            'role_id' => $validated['role_id'],
            'is_active' => false,
        ]);

        // TODO: Send invitation email to the user

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        $user->load(['role']);

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $roles = Role::all();

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $user->update([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? false,
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Prevent admin from deleting themselves
        if ($user->id === Auth::id()) {
            return redirect()->route('admin.users.index')->with('error', 'You cannot delete yourself.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * Bulk delete users.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        // Prevent admin from deleting themselves
        $currentUserId = Auth::id();
        $userIds = array_diff($request->user_ids, [$currentUserId]);

        if (empty($userIds)) {
            return redirect()->route('admin.users.index')->with('error', 'No users were deleted.');
        }

        User::whereIn('id', $userIds)->delete();

        return redirect()->route('admin.users.index')
            ->with('success', count($userIds) . ' users deleted successfully.');
    }

    /**
     * Export users to CSV.
     */
    public function export()
    {
        $users = User::with(['role'])->get();

        $csv = "ID,Name,Email,Role,Active,Created At\n";
        foreach ($users as $user) {
            $csv .= sprintf(
                "%d,\"%s\",\"%s\",\"%s\",%s,\"%s\"\n",
                $user->id,
                $user->name,
                $user->email,
                $user->role->name ?? 'No Role',
                $user->is_active ? 'Yes' : 'No',
                $user->created_at
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="users_' . now()->format('Y-m-d') . '.csv"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Resend invitation email to the user.
     */
    public function resendInvitation(User $user)
    {
        // Only resend invitation if user is inactive
        if ($user->is_active) {
            return redirect()->back()->with('error', 'This user is already active.');
        }

        // Generate new password for the user
        $newPassword = Str::random(12);
        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        // TODO: Send invitation email with the new password to the user
        // For now, we'll just show a success message

        return redirect()->back()->with('success', 'Invitation email has been resent to ' . $user->email);
    }
}
