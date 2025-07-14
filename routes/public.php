<?php

use App\Http\Controllers\InstallController;
use App\Http\Controllers\UserDashboardController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| Routes accessible to all users, including unauthenticated users
|
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

// Welcome page
Route::get('/welcome', function () {
    return Inertia::render('welcome');
})->name('welcome');

// Pricing page
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

// Install script generation (public route)
Route::get('/install/{serverToken}', [InstallController::class, 'generateScript'])
    ->name('install.script');

// Routes accessible to authenticated users only
Route::middleware(['auth', 'verified'])->group(function () {
    // User dashboard - for non-organization specific user functions
    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');
});

// Test route for debugging (should be removed in production)
Route::post('/test-generate-script', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => $request->all(),
        'session_id' => session()->getId(),
        'user' => Auth::user() ? Auth::user()->id : 'not authenticated'
    ]);
})->middleware('auth')->name('test.generate-script');