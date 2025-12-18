<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ProjectController;
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

    // Other menus
    Route::get('/clients', fn() => Inertia::render('Clients/Index'))->name('clients.index');
    Route::get('/proposal', fn() => Inertia::render('Proposals/Index'))->name('proposal.index');
    Route::get('/quotation', fn() => Inertia::render('Quotations/Index'))->name('quotation.index');
    Route::get('/invoice', fn() => Inertia::render('Invoices/Index'))->name('invoice.index');
    Route::get('/payment', fn() => Inertia::render('Payments/Index'))->name('payment.index');
    Route::get('/email', fn() => Inertia::render('Email/Index'))->name('email.index');
    Route::get('/user', fn() => Inertia::render('Users/Index'))->name('user.index');

    // Settings
    Route::prefix('setting')->name('setting.')->group(function () {
        Route::get('/general', [SettingController::class, 'general'])->name('general');
        Route::get('/user-roles', [SettingController::class, 'userRoles'])->name('user-roles');
        Route::get('/leads', [SettingController::class, 'leads'])->name('leads');
        Route::get('/proposals', [SettingController::class, 'proposals'])->name('proposals');
        Route::get('/email', [SettingController::class, 'email'])->name('email');
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
        ->name('projects.status.update');
});
require __DIR__.'/auth.php';