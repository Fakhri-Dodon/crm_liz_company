<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LeadController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\LeadStatusesController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\AppConfigController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('setting')->name('settings.')->group(function () {
        Route::get('/general', [SettingController::class, 'general'])->name('general');
        Route::post('/general', [AppConfigController::class, 'store'])->name('settings.general.store');
        Route::post('/general/upload-logo', [AppConfigController::class, 'uploadLogo'])->name('settings.general.upload-logo');
        Route::get('/user-roles', [SettingController::class, 'userRoles'])->name('user-roles');
        Route::post('/user-roles/store', [SettingController::class, 'userRolesStore'])->name('user-roles.store');
        Route::put('/user-roles/{id}', [SettingController::class, 'userRolesUpdate'])->name('user-roles.update');
        Route::post('/user-roles/role-store', [RolesController::class, 'roleStore'])->name('roles.store');
        Route::get('/leads', [SettingController::class, 'leads'])->name('leads');
        Route::post('/lead-status/store', [LeadStatusesController::class, 'store'])->name('lead-status.store');
        Route::put('/lead-status/update/{id}', [LeadStatusesController::class, 'update'])->name('lead-status.update');
        Route::delete('/lead-status/destroy/{id}', [LeadStatusesController::class, 'destroy'])->name('lead-status.delete');
        Route::get('/proposals', [SettingController::class, 'proposals'])->name('proposals');
        Route::post('/setting/general', [SettingController::class, 'updateGeneral'])->name('setting.general.update');
        Route::get('/email', [SettingController::class, 'email'])->name('email');
    });
});

// Leads Menu
// Route::middleware(['auth'])->group(function () {
    Route::get('/leads', function () {
        return Inertia::render('Leads/Index');
    })->name('leads.index');
// });

require __DIR__.'/auth.php';
