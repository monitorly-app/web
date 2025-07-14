<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Public routes (home, pricing, install, etc.)
require __DIR__ . '/public.php';

// Organization routes  
require __DIR__ . '/organization.php';

// Admin routes
require __DIR__ . '/admin.php';

// Settings routes
require __DIR__ . '/settings.php';

// Auth routes
require __DIR__ . '/auth.php';

// Debug routes (should be removed in production)
require __DIR__ . '/debug.php';
