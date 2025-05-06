<?php

use App\Http\Controllers\AdminAccountController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDashboardController;
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

Route::get('/', function () {
    if (auth()->check()) {
        if (auth()->user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        // Si l'utilisateur a au moins un projet, rediriger vers le dernier projet utilisé
        $lastProject = auth()->user()->projects()->latest()->first();
        if ($lastProject) {
            return redirect()->route('projects.dashboard', $lastProject);
        }

        // Sinon, rediriger vers la page de création de projet
        return redirect()->route('projects.create');
    }
    return redirect()->route('login');
})->name('home');

// Routes accessibles aux utilisateurs authentifiés - gestion des projets
Route::middleware(['auth', 'verified'])->group(function () {
    // Gestion des projets (sans contexte de projet)
    Route::prefix('projects')->group(function () {
        Route::get('/create', [ProjectController::class, 'create'])->name('projects.create');
        Route::post('/', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('/select', [ProjectController::class, 'select'])->name('projects.select');
    });

    // Routes avec contexte de projet
    Route::middleware(['project.access'])->prefix('projects/{project}')->group(function () {
        // Dashboard du projet
        // Ajouter cette ligne pour traiter /projects/{uuid} sans slash final
        Route::get('', [ProjectDashboardController::class, 'index'])->name('projects.dashboard');

        // Garder celle-ci aussi pour la cohérence avec les autres routes
        Route::get('/', [ProjectDashboardController::class, 'index']);

        // Paramètres du projet (accessibles uniquement au propriétaire et admin du projet)
        Route::middleware(['project.owner'])->group(function () {
            Route::get('/settings', [ProjectSettingsController::class, 'index'])->name('projects.settings');
            Route::put('/settings', [ProjectSettingsController::class, 'update'])->name('projects.settings.update');
            Route::delete('/settings', [ProjectSettingsController::class, 'destroy'])->name('projects.settings.destroy');
        });

        // Autres routes spécifiques au projet
        // ...
    });
});

// Routes admin
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Gestion des utilisateurs
    Route::resource('users', UserController::class);
    Route::post('/users/{user}/resend-invitation', [UserController::class, 'resendInvitation'])->name('users.resend-invitation');

    // Gestion des rôles
    Route::resource('roles', RoleController::class);

    // Gestion des plans
    Route::resource('plans', PlanController::class);
});

// Basculer entre le compte admin et le compte personnel
Route::post('/switch-account', [AdminAccountController::class, 'switchAccount'])
    ->name('admin.switch-account')
    ->middleware('auth');

// Routes de paramètres utilisateur
require __DIR__ . '/settings.php';

// Routes d'authentification
require __DIR__ . '/auth.php';
