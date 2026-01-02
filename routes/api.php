<?php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProposalController;

Route::get('/test', [LeadController::class, 'test']);

// Hanya pertahankan endpoint yang benar-benar diperlukan
Route::get('/lead-statuses', [LeadController::class, 'getStatuses']);

// Leads API routes - hanya untuk create/update/delete
Route::prefix('leads')->group(function () {
    // GET endpoint di-comment karena error
    // Route::get('/', [LeadController::class, 'indexApi']);
    Route::post('/', [LeadController::class, 'store']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::delete('/{id}', [LeadController::class, 'destroy']);
});

// Current User Info (jika diperlukan)
Route::get('/current-user', [LeadController::class, 'getCurrentUserInfo']);

Route::get('/proposal/templates', [ProposalController::class, 'templates']);