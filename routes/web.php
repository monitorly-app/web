<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\InstallController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\OrganizationDashboardController;
use App\Http\Controllers\OrganizationInvitationController;
use App\Http\Controllers\OrganizationMembersController;
use App\Http\Controllers\OrganizationServersController;
use App\Http\Controllers\OrganizationSettingsController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Home route - redirects to the appropriate dashboard based on user role
Route::get('/', function () {
    if (!Auth::check()) {
        return Inertia::render('welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
    }

    // User is authenticated
    $user = Auth::user();

    // If user is admin and in admin mode, always redirect to admin dashboard
    if ($user->isAdmin() && session('admin_mode', true) === true) {
        return redirect()->route('admin.dashboard');
    }

    // If the user has at least one organization, redirect to the last organization used
    $lastOrganization = $user->ownedOrganizations()->latest()->first();

    if ($lastOrganization) {
        return redirect()->route('organizations.dashboard', $lastOrganization);
    }

    // Otherwise, redirect to the organization creation page
    return redirect()->route('organizations.create');
})->name('home');

// PUBLIC: Accept invitation route (accessible without authentication)
Route::get('/invitations/{token}/accept', [OrganizationInvitationController::class, 'accept'])
    ->name('invitations.accept');

// Routes accessible to authenticated users
Route::middleware(['auth', 'verified'])->group(function () {
    // User dashboard - for non-organization specific user functions
    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');

    // Server script generation
    Route::post('/servers/generate-script', [OrganizationServersController::class, 'generateScript'])->name('servers.generate-script');

    // Organization selection and creation (no organization context)
    Route::prefix('organizations')->name('organizations.')->group(function () {
        Route::get('/create', [OrganizationController::class, 'create'])->name('create');
        Route::post('/', [OrganizationController::class, 'store'])->name('store');
        Route::get('/select', [OrganizationController::class, 'select'])->name('select');
    });

    // Organization-specific routes (with organization context)
    Route::prefix('organizations/{organization}')->name('organizations.')->middleware(['organization.access'])->group(function () {
        // Organization dashboard
        Route::get('/', [OrganizationDashboardController::class, 'index'])->name('dashboard');

        // Organization servers
        Route::prefix('servers')->name('servers.')->group(function () {
            Route::get('/', [OrganizationServersController::class, 'index'])->name('index');
            Route::get('/create', [OrganizationServersController::class, 'create'])->name('create');
            Route::post('/', [OrganizationServersController::class, 'store'])->name('store');
            Route::get('/{server}', [OrganizationServersController::class, 'show'])->name('show');
            Route::get('/{server}/edit', [OrganizationServersController::class, 'edit'])->name('edit');
            Route::put('/{server}', [OrganizationServersController::class, 'update'])->name('update');
            Route::delete('/{server}', [OrganizationServersController::class, 'destroy'])->name('destroy');
        });

        // Organization members
        Route::prefix('members')->name('members.')->group(function () {
            Route::get('/', [OrganizationMembersController::class, 'index'])->name('index');
            Route::post('/', [OrganizationMembersController::class, 'store'])->name('store');
            Route::put('/{user}', [OrganizationMembersController::class, 'update'])->name('update');
            Route::delete('/{user}', [OrganizationMembersController::class, 'destroy'])->name('destroy');
        });

        // Organization invitations
        Route::prefix('invitations')->name('invitations.')->group(function () {
            Route::delete('/{invitation}', [OrganizationInvitationController::class, 'destroy'])->name('destroy');
            Route::post('/{invitation}/resend', [OrganizationInvitationController::class, 'resend'])->name('resend');
        });

        // Organization settings - only for owners/admins
        Route::middleware(['organization.owner'])->group(function () {
            Route::get('/settings', [OrganizationSettingsController::class, 'show'])->name('settings');
            Route::post('/settings', [OrganizationSettingsController::class, 'update'])->name('settings.update');
            Route::post('/settings/remove-logo', [OrganizationSettingsController::class, 'removeLogo'])->name('settings.remove-logo');
            Route::delete('/settings', [OrganizationSettingsController::class, 'destroy'])->name('settings.destroy');
            Route::post('/settings/regenerate-api-key', [OrganizationSettingsController::class, 'regenerateApiKey'])->name('settings.regenerate-api-key');
            Route::post('/settings/regenerate-encryption-key', [OrganizationSettingsController::class, 'regenerateEncryptionKey'])->name('settings.regenerate-encryption-key');
            Route::post('/settings/regenerate-all-keys', [OrganizationSettingsController::class, 'regenerateAllKeys'])->name('settings.regenerate-all-keys');
        });

        // Overview route (duplicate of dashboard for explicit routing)
        Route::get('/overview', [OrganizationController::class, 'overview'])->name('overview');

        // Billing route - only for owners
        Route::get('/billing', [OrganizationController::class, 'billing'])->name('billing')->middleware(['organization.owner']);
    });
});
Route::get('/install/{serverToken}', [InstallController::class, 'generateScript'])
    ->name('install.script');

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Users management
    Route::resource('users', UserController::class);
    Route::post('/users/{user}/resend-invitation', [UserController::class, 'resendInvitation'])->name('users.resend-invitation');

    // Roles management
    Route::resource('roles', RoleController::class);

    // Plans management
    Route::resource('plans', PlanController::class);

    // Organization Roles management
    Route::resource('organization-roles', \App\Http\Controllers\Admin\OrganizationRoleController::class);
    Route::post('/organization-roles/{organizationRole}/update-permissions', [\App\Http\Controllers\Admin\OrganizationRoleController::class, 'updateSystemRolePermissions'])
        ->name('organization-roles.update-permissions');

    // Permissions management
    // Route::resource('permissions', \App\Http\Controllers\Admin\PermissionController::class);
    // Route::post('/permissions/assign-to-role', [\App\Http\Controllers\Admin\PermissionController::class, 'assignToRole'])->name('permissions.assign-to-role');
    // Route::post('/permissions/revoke-from-role', [\App\Http\Controllers\Admin\PermissionController::class, 'revokeFromRole'])->name('permissions.revoke-from-role');
});

// Account switching for admins
Route::post('/switch-account', [AdminAccountController::class, 'switchToPersonalAccount'])
    ->name('admin.switch-account')
    ->middleware('auth');

Route::post('/switch-to-admin', [AdminAccountController::class, 'switchToAdminMode'])
    ->name('admin.switch-to-admin')
    ->middleware('auth');

// Settings routes
require __DIR__ . '/settings.php';

// Auth routes
require __DIR__ . '/auth.php';

require __DIR__ . '/debug.php';

Route::get('/welcome', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::get('/pricing', function () {
    // Récupérer les plans triés par prix annuel croissant
    $plans = App\Models\Plan::all()->sortBy(function ($plan) {
        return $plan->price['yearly'] ?? 0;
    })->values();

    $currentUserPlan = \Illuminate\Support\Facades\Auth::check() ? \Illuminate\Support\Facades\Auth::user()->plan : null;

    return Inertia::render('pricing', [
        'plans' => $plans,
        'currentUserPlan' => $currentUserPlan,
    ]);
})->name('pricing');
// Test route for debugging
Route::post('/test-generate-script', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => $request->all(),
        'session_id' => session()->getId(),
        'user' => Auth::user() ? Auth::user()->id : 'not authenticated'
    ]);
})->middleware('auth')->name('test.generate-script');
