<?php

use App\Http\Controllers\AdminAccountController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDashboardController;
use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectSettingsController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group.
|
*/

// Home route - redirects to the appropriate dashboard based on user role
Route::get('/', function () {
    if (auth()->check()) {
        if (auth()->user()->isAdmin() && session('admin_mode', true)) {
            return redirect()->route('admin.dashboard');
        }

        // For regular users or admins in personal mode
        // If the user has at least one project, redirect to the last project used
        $lastProject = auth()->user()->projects()->latest()->first();
        if ($lastProject) {
            return redirect()->route('projects.dashboard', $lastProject);
        }

        // Otherwise, redirect to the project creation page
        return redirect()->route('projects.create');
    }
    return redirect()->route('login');
})->name('home');

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
            Route::get('/', [ProjectMemberController::class, 'index'])->name('index');
            Route::post('/', [ProjectMemberController::class, 'store'])->name('store');
            Route::put('/{user}', [ProjectMemberController::class, 'update'])->name('update');
            Route::delete('/{user}', [ProjectMemberController::class, 'destroy'])->name('destroy');
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
