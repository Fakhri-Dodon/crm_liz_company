<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\LeadStatusesController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\ProposalNumberFormated;
use App\Http\Controllers\ProposalStatusesController;
use App\Http\Controllers\AppConfigController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. PUBLIC ROUTE (Redirect ke Login)
Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// 2. PROTECTED ROUTES (Hanya untuk User Login)
Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Main Menus
    Route::get('/lead', [LeadController::class, 'index'])->name('lead.index');
    Route::get('/clients', fn() => Inertia::render('Clients/Index'))->name('clients.index');
    Route::get('/proposal', fn() => Inertia::render('Proposals/Index'))->name('proposal.index');
    Route::get('/quotation', fn() => Inertia::render('Quotations/Index'))->name('quotation.index');
    Route::get('/invoice', fn() => Inertia::render('Invoices/Index'))->name('invoice.index');
    Route::get('/payment', fn() => Inertia::render('Payments/Index'))->name('payment.index');
    Route::get('/project', fn() => Inertia::render('Projects/Index'))->name('project.index');
    Route::get('/email-inbox', fn() => Inertia::render('Email/Index'))->name('email.index');
    Route::get('/user-management', fn() => Inertia::render('Users/Index'))->name('user.index');

    // --- SETTINGS GROUP (Konsisten menggunakan 'settings.') ---
    Route::prefix('setting')->name('settings.')->group(function () {
        // General
        Route::get('/general', [SettingController::class, 'general'])->name('general');
        Route::post('/general/store', [AppConfigController::class, 'store'])->name('general.store');
        Route::post('/general/upload-logo', [AppConfigController::class, 'uploadLogo'])->name('general.upload-logo');
        
        // User Roles & Permissions
        Route::get('/user-roles', [SettingController::class, 'userRoles'])->name('user-roles');
        Route::post('/user-roles/store', [SettingController::class, 'userRolesStore'])->name('user-roles.store');
        Route::put('/user-roles/{id}', [SettingController::class, 'userRolesUpdate'])->name('user-roles.update');
        Route::post('/user-roles/role-store', [RolesController::class, 'roleStore'])->name('roles.store');
        
        // Leads Settings
        Route::get('/leads', [SettingController::class, 'leads'])->name('leads');
        Route::post('/lead-status/store', [LeadStatusesController::class, 'store'])->name('lead-status.store');
        Route::put('/lead-status/update/{id}', [LeadStatusesController::class, 'update'])->name('lead-status.update');
        Route::delete('/lead-status/destroy/{id}', [LeadStatusesController::class, 'destroy'])->name('lead-status.delete');
        
        // Proposals
        Route::get('/proposals', [SettingController::class, 'proposals'])->name('proposals');
        Route::post('/proposal_numbering/update/{id}', [ProposalNumberFormated::class, 'update'])->name('proposal_numbering.update');
        Route::post('/proposal-status/store', [ProposalStatusesController::class, 'store'])->name('proposal-status.store');
        Route::put('/proposal-status/update/{id}', [ProposalStatusesController::class, 'update'])->name('proposal-status.update');
        Route::delete('/proposal-status/destroy/{id}', [ProposalStatusesController::class, 'destroy'])->name('proposal-status.delete');

        // Emails
        Route::get('/email', [SettingController::class, 'email'])->name('email');
    });

    // Header menus
    Route::get('/language', fn() => Inertia::render('Language/Index'))->name('language.index');
    Route::get('/notifications', fn() => Inertia::render('Notifications/Index'))->name('notifications.index');
});

require __DIR__.'/auth.php';