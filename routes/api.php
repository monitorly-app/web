<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetricsController;

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
