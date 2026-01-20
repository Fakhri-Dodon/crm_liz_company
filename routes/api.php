<?php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\CompanyController;
use App\Models\User;

Route::get('/test', [LeadController::class, 'test']);

// Users API (untuk dropdown di lead modal) - FIXED VERSION
Route::get('/users', function () {
    try {
        \Log::info('=== FETCHING USERS FOR DROPDOWN ===');
        
        // Cek schema dulu
        $hasIsActive = \Schema::hasColumn('users', 'is_active');
        $hasRole = \Schema::hasColumn('users', 'role');
        
        \Log::info('Schema check - has is_active: ' . ($hasIsActive ? 'true' : 'false'));
        \Log::info('Schema check - has role: ' . ($hasRole ? 'true' : 'false'));
        
        // Query dasar
        $query = User::select(['id', 'name', 'email']);
        
        // Tambahkan role jika ada
        if ($hasRole) {
            $query->addSelect('role');
        }
        
        // Filter hanya user aktif jika column exists
        if ($hasIsActive) {
            $query->where('is_active', true);
        }
        
        // Order dan ambil data
        $users = $query->orderBy('name')->get();
        
        \Log::info('Total users found: ' . $users->count());
        
        // Format response
        $formattedUsers = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? null,
                'is_active' => $user->is_active ?? true,
            ];
        });
        
        return response()->json($formattedUsers);
        
    } catch (\Exception $e) {
        \Log::error('Failed to fetch users: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        // Fallback: return empty array untuk testing
        return response()->json([
            'error' => 'Failed to fetch users',
            'message' => env('APP_DEBUG') ? $e->getMessage() : 'Server error',
            'users' => [] // Return empty array agar frontend tidak error
        ], 500);
    }
});


// Statuses API
Route::get('/lead-statuses', [LeadController::class, 'getStatuses']);

// Leads API routes
Route::prefix('leads')->group(function () {
    Route::post('/', [LeadController::class, 'store']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::delete('/{id}', [LeadController::class, 'destroy']);
});

// Current User Info
Route::get('/current-user', [LeadController::class, 'getCurrentUserInfo']);

Route::get('/proposal/templates', [ProposalController::class, 'templates']);
Route::get('/proposal/icon', [ProposalController::class, 'icon']);