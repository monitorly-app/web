<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetricsController;

// DEBUG: Log toutes les requêtes API
Route::any('{any}', function ($any, Request $request) {
    \Log::info('=== ANY API REQUEST ===', [
        'path' => $any,
        'method' => $request->method(),
        'full_url' => $request->fullUrl(),
        'headers' => $request->headers->all(),
        'user_agent' => $request->header('User-Agent'),
        'body_preview' => substr($request->getContent(), 0, 100)
    ]);

    // Continue vers les vraies routes
    return abort(404, 'Debug route hit');
})->where('any', '.*');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes pour les métriques Monitorly
Route::prefix('projects/{project_id}')->group(function () {
    Route::post('/metrics', [MetricsController::class, 'store'])
        ->name('api.metrics.store');
    Route::get('/servers/{server_id}/metrics', [MetricsController::class, 'getServerMetrics'])
        ->name('api.servers.metrics');
});
