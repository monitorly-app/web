<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetricsController;
use App\Http\Controllers\Api\ProbeController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// New PROBE.md compliant endpoints
Route::prefix('api/{organization_id}/servers/{server_id}')->group(function () {
    // System information endpoint (probe startup)
    Route::post('/info', [ProbeController::class, 'storeSystemInfo'])->name('probe.system-info');
    
    // Regular metrics endpoint
    Route::post('/metrics', [ProbeController::class, 'storeMetrics'])->name('probe.metrics');
    
    // Configuration management endpoints
    Route::post('/config', [ProbeController::class, 'validateConfig'])->name('probe.validate-config');
    Route::get('/config', [ProbeController::class, 'getConfig'])->name('probe.get-config');
});

// Legacy routes for backward compatibility (will be deprecated)
Route::post('organizations/{organization_id}', [MetricsController::class, 'store'])
    ->name('metrics.store.legacy');

Route::prefix('organizations/{organization_id}')->group(function () {
    Route::post('/metrics', [MetricsController::class, 'store'])
        ->name('api.metrics.store.original');
    Route::get('/servers/{server_id}/metrics', [MetricsController::class, 'getServerMetrics'])
        ->name('metrics.server');
});
