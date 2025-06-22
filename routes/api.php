<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetricsController;
use Illuminate\Support\Facades\Log;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::any('projects/{anything}', function ($anything, Request $request) {
    Log::info('=== CATCH ALL DEBUG ===', [
        'anything' => $anything,
        'method' => $request->method(),
        'full_url' => $request->fullUrl(),
        'path' => $request->path(),
        'headers' => $request->headers->all()
    ]);

    return response()->json(['debug' => 'catch-all hit', 'path' => $anything]);
})->where('anything', '.*');

// Routes pour les métriques Monitorly
Route::prefix('projects/{project_id}')->group(function () {
    // Endpoint principal pour recevoir les métriques des probes
    Route::post('/metrics', [MetricsController::class, 'store'])
        ->name('api.metrics.store');

    // Endpoint pour récupérer les métriques d'un serveur spécifique
    Route::get('/servers/{server_id}/metrics', [MetricsController::class, 'getServerMetrics'])
        ->name('api.servers.metrics');
});
