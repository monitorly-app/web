<?php

use App\Http\Controllers\AdminAccountController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Admin routes
// Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {
//     Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

//     // Users management
//     Route::resource('users', UserController::class);
//     Route::post('/users/{user}/resend-invitation', [UserController::class, 'resendInvitation'])->name('users.resend-invitation');

//     // Roles management
//     Route::resource('roles', RoleController::class);

//     // Plans management
//     Route::resource('plans', PlanController::class);
// });

// Route::post('/switch-account', [AdminAccountController::class, 'switchAccount'])
//     ->name('admin.switch-account')
//     ->middleware('auth');
