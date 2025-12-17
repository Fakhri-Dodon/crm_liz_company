<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LeadController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingController;
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
});

// Leads Menu
// Route::middleware(['auth'])->group(function () {
    Route::get('/leads', function () {
        return Inertia::render('Leads/Index');
    })->name('leads.index');
// });


Route::prefix('setting')->name('settings.')->group(function () {
    Route::get('/general', [SettingController::class, 'general'])->name('general');
    Route::get('/user-roles', [SettingController::class, 'userRoles'])->name('user-roles');
    Route::get('/leads', [SettingController::class, 'leads'])->name('leads');
    Route::get('/proposals', [SettingController::class, 'proposals'])->name('proposals');
    Route::get('/email', [SettingController::class, 'email'])->name('email');
});

require __DIR__.'/auth.php';
