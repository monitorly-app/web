<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;


Route::any('/debug/{project_id}/metrics', function ($projectId) {
    Log::info('DEBUG: Metrics endpoint hit', [
        'project_id' => $projectId,
        'method' => request()->method(),
        'headers' => request()->headers->all(),
        'body' => request()->all()
    ]);

    return response()->json(['debug' => 'endpoint hit', 'project_id' => $projectId]);
});
