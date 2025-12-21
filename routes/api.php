
<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\SectionController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working',
        'timestamp' => now()->toDateTimeString()
    ]);
});

Route::prefix('leads')->group(function () {
    Route::get('/', [LeadController::class, 'indexApi']);
    Route::post('/', [LeadController::class, 'store']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::delete('/{id}', [LeadController::class, 'destroy']);
});


Route::prefix('proposal/sections')->group(function () {
    Route::get('/', [SectionController::class, 'index']);
    Route::get('/{id}', [SectionController::class, 'show']);
    Route::post('/', [SectionController::class, 'store']);
    Route::put('/{id}', [SectionController::class, 'update']);
    Route::delete('/{id}', [SectionController::class, 'destroy']);
    Route::patch('/reorder', [SectionController::class, 'reorder']);
});


