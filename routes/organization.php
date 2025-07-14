<?php

use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\OrganizationDashboardController;
use App\Http\Controllers\OrganizationInvitationController;
use App\Http\Controllers\OrganizationMembersController;
use App\Http\Controllers\OrganizationServersController;
use App\Http\Controllers\OrganizationSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Organization Routes
|--------------------------------------------------------------------------
|
| Routes for organization management and organization-scoped resources
|
*/

// Routes accessible to authenticated users
Route::middleware(['auth', 'verified'])->group(function () {
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
        
        // Plan change routes - only for owners
        Route::get('/change-plan', [OrganizationController::class, 'changePlan'])->name('change-plan')->middleware(['organization.owner']);
        Route::post('/change-plan', [OrganizationController::class, 'updatePlan'])->name('update-plan')->middleware(['organization.owner']);
    });
});

// PUBLIC: Accept invitation route (accessible without authentication)
Route::get('/invitations/{token}/accept', [OrganizationInvitationController::class, 'accept'])
    ->name('invitations.accept');