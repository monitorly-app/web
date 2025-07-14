<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\PlanController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Routes for administrative functions, accessible only by users with admin role
|
*/

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Users management
    Route::delete('/users/bulk', [UserController::class, 'bulkDelete'])->name('users.bulk-delete');
    Route::get('/users/export', [UserController::class, 'export'])->name('users.export');
    Route::post('/users/{user}/resend-invitation', [UserController::class, 'resendInvitation'])->name('users.resend-invitation');
    Route::resource('users', UserController::class);

    // Roles management
    Route::resource('roles', RoleController::class);

    // Plans management
    Route::resource('plans', PlanController::class);

    // Organization Roles management
    Route::resource('organization-roles', \App\Http\Controllers\Admin\OrganizationRoleController::class);
    Route::post('/organization-roles/{organizationRole}/update-permissions', [\App\Http\Controllers\Admin\OrganizationRoleController::class, 'updateSystemRolePermissions'])
        ->name('organization-roles.update-permissions');

    // Organizations supervision
    Route::prefix('organizations')->name('organizations.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\OrganizationController::class, 'index'])->name('index');
        Route::get('/export', [\App\Http\Controllers\Admin\OrganizationController::class, 'export'])->name('export');
        Route::get('/stats', [\App\Http\Controllers\Admin\OrganizationController::class, 'stats'])->name('stats');
        Route::get('/{organization}', [\App\Http\Controllers\Admin\OrganizationController::class, 'show'])->name('show');
        Route::post('/{organization}/suspend', [\App\Http\Controllers\Admin\OrganizationController::class, 'suspend'])->name('suspend');
        Route::post('/{organization}/reactivate', [\App\Http\Controllers\Admin\OrganizationController::class, 'reactivate'])->name('reactivate');
        Route::post('/{organization}/regenerate-api-key', [\App\Http\Controllers\Admin\OrganizationController::class, 'regenerateApiKey'])->name('regenerate-api-key');
        Route::get('/{organization}/members', [\App\Http\Controllers\Admin\OrganizationController::class, 'members'])->name('members');
        Route::get('/{organization}/servers', [\App\Http\Controllers\Admin\OrganizationController::class, 'servers'])->name('servers');
    });

    // Permissions management (commented out)
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
