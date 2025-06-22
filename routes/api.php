<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetricsController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes pour les métriques Monitorly
Route::prefix('projects/{project_id}')->group(function () {
    // Endpoint principal pour recevoir les métriques des probes
    Route::post('/metrics', [MetricsController::class, 'store'])
        ->name('api.metrics.store');

    // Endpoint pour récupérer les métriques d'un serveur spécifique
    Route::get('/servers/{server_id}/metrics', [MetricsController::class, 'getServerMetrics'])
        ->name('api.servers.metrics');
});
