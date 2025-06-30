<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetricsController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Route pour matcher ce que la probe envoie réellement
Route::post('organizations/{organization_id}', [MetricsController::class, 'store'])
    ->name('metrics.store');

// Route originale pour l'API
Route::prefix('organizations/{organization_id}')->group(function () {
    Route::post('/metrics', [MetricsController::class, 'store'])
        ->name('api.metrics.store.original');
    Route::get('/servers/{server_id}/metrics', [MetricsController::class, 'getServerMetrics'])
        ->name('metrics.server');
});
