<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\PlanController;

use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDashboardController;
use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\ProjectMembersController;
use App\Http\Controllers\ProjectServersController;
use App\Http\Controllers\ProjectSettingsController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Home route - redirects to the appropriate dashboard based on user role
Route::get('/', function () {
    if (Auth::check()) {
        if (Auth::user()->isAdmin() && session('admin_mode', true)) {
            return redirect()->route('admin.dashboard');
        }

        // For regular users or admins in personal mode
        // If the user has at least one project, redirect to the last project used
        $lastProject = Auth::user()->projects()->latest()->first();
        if ($lastProject) {
            return redirect()->route('projects.dashboard', $lastProject);
        }

        // Otherwise, redirect to the project creation page
        return redirect()->route('projects.create');
    }
    return redirect()->route('login');
})->name('home');

// PUBLIC: Accept invitation route (accessible without authentication)
Route::get('/invitations/{token}/accept', [ProjectInvitationController::class, 'accept'])
    ->name('invitations.accept');

// Routes accessible to authenticated users
Route::middleware(['auth', 'verified'])->group(function () {
    // User dashboard - for non-project specific user functions
    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('user.dashboard');

    // Project selection and creation (no project context)
    Route::prefix('projects')->name('projects.')->group(function () {
        Route::get('/create', [ProjectController::class, 'create'])->name('create');
        Route::post('/', [ProjectController::class, 'store'])->name('store');
        Route::get('/select', [ProjectController::class, 'select'])->name('select');
    });

    // Project-specific routes (with project context)
    Route::prefix('projects/{project}')->name('projects.')->middleware(['project.access'])->group(function () {
        // Dashboard
        Route::get('/', [ProjectDashboardController::class, 'index'])->name('dashboard');

        // Project members management
        Route::prefix('members')->name('members.')->group(function () {
            Route::get('/', [ProjectMembersController::class, 'index'])->name('index');
            Route::post('/', [ProjectMembersController::class, 'store'])->name('store');
            Route::put('/{user}', [ProjectMembersController::class, 'update'])->name('update');
            Route::delete('/{user}', [ProjectMembersController::class, 'destroy'])->name('destroy');
        });

        // Invitations
        Route::prefix('invitations')->name('invitations.')->group(function () {
            Route::post('/', [ProjectInvitationController::class, 'store'])->name('store');
            Route::delete('/{invitation}', [ProjectInvitationController::class, 'destroy'])->name('destroy');
            Route::post('/{invitation}/resend', [ProjectInvitationController::class, 'resend'])->name('resend');
        });

        // Project settings (owner or project admin only)
        Route::middleware(['project.owner'])->group(function () {
            Route::get('/settings', [ProjectSettingsController::class, 'index'])->name('settings.index');
            Route::put('/settings', [ProjectSettingsController::class, 'update'])->name('settings.update');
            Route::put('/settings/plan', [ProjectSettingsController::class, 'updatePlan'])->name('settings.plan.update');
            Route::delete('/settings', [ProjectSettingsController::class, 'destroy'])->name('settings.destroy');

            // API Keys management
            Route::post('/settings/regenerate-api-key', [ProjectSettingsController::class, 'regenerateApiKey'])->name('settings.regenerate-api-key');
            Route::post('/settings/regenerate-encryption-key', [ProjectSettingsController::class, 'regenerateEncryptionKey'])->name('settings.regenerate-encryption-key');
            Route::post('/settings/regenerate-all-keys', [ProjectSettingsController::class, 'regenerateAllKeys'])->name('settings.regenerate-all-keys');
        });


        // Servers management
        Route::prefix('servers')->name('servers.')->group(function () {
            Route::get('/', [ProjectServersController::class, 'index'])->name('index');
            Route::get('/create', [ProjectServersController::class, 'create'])->name('create');
            Route::post('/', [ProjectServersController::class, 'store'])->name('store');
            Route::get('/{server}', [ProjectServersController::class, 'show'])->name('show');
            Route::put('/{server}', [ProjectServersController::class, 'update'])->name('update');
            Route::delete('/{server}', [ProjectServersController::class, 'destroy'])->name('destroy');
            Route::post('/{server}/regenerate-token', [ProjectServersController::class, 'regenerateToken'])->name('regenerate-token');
        });
    });
});

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
});

// Account switching for admins
Route::post('/switch-account', [AdminAccountController::class, 'switchAccount'])
    ->name('admin.switch-account')
    ->middleware('auth');

// Settings routes
require __DIR__ . '/settings.php';

// Auth routes
require __DIR__ . '/auth.php';
