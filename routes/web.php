<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\LeadStatusesController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\ProposalNumberFormated;
use App\Http\Controllers\ProposalStatusesController;
use App\Http\Controllers\AppConfigController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\EmailSettingsController;
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
    Route::get('/email', fn() => Inertia::render('Email/Index'))->name('email.inbox');
    Route::get('/user', fn() => Inertia::render('Users/Index'))->name('user.management');

    Route::prefix('setting')->name('settings.')->group(function () {
        // General
        Route::prefix('general')->name('general.')->group(function () {
            Route::get('/', [SettingController::class, 'general']);
            Route::post('/store', [AppConfigController::class, 'store'])->name('store');
            Route::post('/upload-logo', [AppConfigController::class, 'uploadLogo'])->name('upload-logo');
        });
        
        // User Roles & Permissions
        Route::prefix('user-roles')->name('user-roles.')->group(function () {
            Route::get('/', [SettingController::class, 'userRoles']);
            Route::post('/store', [SettingController::class, 'userRolesStore'])->name('store');
            Route::put('/{id}', [SettingController::class, 'userRolesUpdate'])->name('update');
            Route::post('/role-store', [RolesController::class, 'roleStore'])->name('roles.store');
        });
        
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
        Route::prefix('email')->name('email.')->group(function () {
            Route::get('/', [SettingController::class, 'email']);
            Route::post('/save', [EmailSettingsController::class, 'saveSettings'])->name('save');
            Route::post('/test', [EmailSettingsController::class, 'testConnection'])->name('test');
            Route::delete('/destroy-log/{id}', [EmailSettingsController::class, 'destroyLog'])->name('destroy-log');
        });
    });


    // Header menus
    Route::get('/language', fn() => Inertia::render('Language/Index'))->name('language.index');
    Route::get('/notifications', fn() => Inertia::render('Notifications/Index'))->name('notifications.index');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // ... route lainnya ...
    
    // Projects routes
    Route::resource('projects', ProjectController::class);
    
    // **TAMBAHKAN INI: Route khusus untuk update status**
    Route::patch('/projects/{project}/status', [ProjectController::class, 'updateStatus'])
        ->name('projects.status.update');
    // Atau jika ingin menggunakan POST:
    Route::post('/projects/{project}/status', [ProjectController::class, 'updateStatus'])
        ->name('projects.status.update.post');
});
require __DIR__.'/auth.php';