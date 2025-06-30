<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;


Route::any('/debug/{organization_id}/metrics', function ($organizationId) {
    Log::info('DEBUG: Metrics endpoint hit', [
        'organization_id' => $organizationId,
        'method' => request()->method(),
        'headers' => request()->headers->all(),
        'body' => request()->all(),
        'ip' => request()->ip(),
        'user_agent' => request()->userAgent(),
    ]);

    return response()->json([
        'organization_id' => $organizationId,
        'method' => request()->method(),
        'headers' => request()->headers->all(),
        'body' => request()->all(),
        'ip' => request()->ip(),
        'user_agent' => request()->userAgent(),
    ]);
});
