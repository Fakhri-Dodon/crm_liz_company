<?php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProposalController;

Route::get('/test', [LeadController::class, 'test']);

// Leads API routes
Route::prefix('leads')->group(function () {
    Route::get('/', [LeadController::class, 'indexApi']);
    Route::post('/', [LeadController::class, 'store']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::delete('/{id}', [LeadController::class, 'destroy']);
});

// Statuses API
Route::get('/lead-statuses', [LeadController::class, 'getStatuses']);

Route::get('/proposal/templates', [ProposalController::class, 'templates']);