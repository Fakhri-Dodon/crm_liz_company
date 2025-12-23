<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\EmailSettingsController;
use App\Http\Controllers\CompanyController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Leads
    Route::get('/lead', [LeadController::class, 'index'])->name('lead.index');
    Route::get('/proposal', fn() => Inertia::render('Proposals/Index'))->name('proposal.index');
    Route::get('/quotation', fn() => Inertia::render('Quotations/Index'))->name('quotation.index');
    Route::get('/invoice', fn() => Inertia::render('Invoices/Index'))->name('invoice.index');
    Route::get('/payment', fn() => Inertia::render('Payments/Index'))->name('payment.index');
    Route::get('/email', fn() => Inertia::render('Email/Index'))->name('email.index');
    Route::get('/user', fn() => Inertia::render('Users/Index'))->name('user.index');

    Route::prefix('setting')->name('settings.')->group(function () {
        // General
        Route::prefix('general')->name('general.')->group(function () {
            Route::get('/', [SettingController::class, 'general']);
            // KOMENTARI ROUTE YANG ERROR
            // Route::post('/store', [AppConfigController::class, 'store'])->name('store');
            // Route::post('/upload-logo', [AppConfigController::class, 'uploadLogo'])->name('upload-logo');
        });
        
        // User Roles & Permissions
        Route::prefix('user-roles')->name('user-roles.')->group(function () {
            Route::get('/', [SettingController::class, 'userRoles']);
            Route::post('/store', [SettingController::class, 'userRolesStore'])->name('store');
            Route::put('/{id}', [SettingController::class, 'userRolesUpdate'])->name('update');
            // KOMENTARI ROUTE YANG ERROR
            // Route::post('/role-store', [RolesController::class, 'roleStore'])->name('roles.store');
        });
        
        // Leads Settings
        Route::get('/leads', [SettingController::class, 'leads'])->name('leads');
        Route::get('/proposals', [SettingController::class, 'proposals'])->name('proposals');
        // KOMENTARI ROUTE YANG ERROR
        // Route::post('/proposal_numbering/update/{id}', [ProposalNumberFormated::class, 'update'])->name('proposal_numbering.update');
        // Route::post('/proposal-status/store', [ProposalStatusesController::class, 'store'])->name('proposal-status.store');
        // Route::put('/proposal-status/update/{id}', [ProposalStatusesController::class, 'update'])->name('proposal-status.update');
        // Route::delete('/proposal-status/destroy/{id}', [ProposalStatusesController::class, 'destroy'])->name('proposal-status.delete');

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
    // Projects routes
    Route::resource('projects', ProjectController::class);
    Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus'])
        ->name('projects.status.update');
});


Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    // Company Routes
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::get('/companies/create', [CompanyController::class, 'create'])->name('companies.create');
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    
    // Specific routes before parameter routes
    Route::get('/companies/get-leads', [CompanyController::class, 'getLeadsForCreation'])
        ->name('companies.get-leads');
    Route::get('/companies/statistics', [CompanyController::class, 'getStatistics'])
        ->name('companies.statistics');
    
    // Parameter routes
    Route::get('/companies/{company}', [CompanyController::class, 'show'])->name('companies.show');
    Route::get('/companies/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    
    // Delete routes
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
    Route::delete('/companies/force-delete/{company}', [CompanyController::class, 'forceDelete'])
        ->name('companies.force-delete');
    
    // Restore route
    Route::post('/companies/{company}/restore', [CompanyController::class, 'restore'])
        ->name('companies.restore');
});

require __DIR__.'/auth.php';