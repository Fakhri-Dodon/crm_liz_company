<?php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working',
        'user_exists' => \App\Models\User::count() > 0
    ]);
});

// Leads API routes
Route::prefix('leads')->group(function () {
    Route::get('/', [LeadController::class, 'indexApi']);
    Route::post('/', [LeadController::class, 'store']);
    Route::get('/{id}', [LeadController::class, 'show']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::delete('/{id}', [LeadController::class, 'destroy']); // HARD DELETE
    
    // Optional: soft delete route
    Route::delete('/{id}/soft', [LeadController::class, 'softDelete']); // SOFT DELETE
    Route::post('/{id}/restore', [LeadController::class, 'restore']);
});