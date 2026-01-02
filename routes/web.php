<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\LeadStatusesController;
use App\Http\Controllers\AppConfigController;
use App\Http\Controllers\ProposalStatusesController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\EmailSettingsController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Quotation\QuotationController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\ProposalNumberFormated;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

// Route::get('/run-migration', function () {
//     Artisan::call('migrate --force');
//     return "Migration success!";
// });

Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Route::get('/dashboard', function () {
    //     return Inertia::render('Dashboard');
    // })->name('dashboard');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Leads
    Route::get('/lead', [LeadController::class, 'index'])->name('lead.index');
    
    //Quotation Modul - TAMBAHKAN ROUTE show DI SINI
    Route::prefix('quotation')->name('quotation.')->group(function() {
        Route::get('/', [QuotationController::class, 'index'])->name('index');
        Route::get('/create', [QuotationController::class, 'create'])->name('create');
        Route::post('/store', [QuotationController::class, 'store'])->name('store');
        Route::get('/{quotation}', [QuotationController::class, 'show'])->name('show');
        Route::patch('/{quotation}/status', [QuotationController::class, 'updateStatus'])->name('update-status');
        Route::get('/edit/{quotation}', [QuotationController::class, 'edit'])->name('edit');
        Route::patch('/update/{quotation}', [QuotationController::class, 'update'])->name('update');
        Route::delete('/destroy/{quotation}', [QuotationController::class, 'destroy'])->name('destroy');
        Route::post('/status-notify/{id}', [QuotationController::class, 'notificationUpdateStatus'])->name('notification-status');
    });

    // tanda notif udh di read
    Route::post('/notifications/mark-all-read', [QuotationController::class, 'markAllRead']);
    Route::post('/notifications/mark-as-sent/{id}', [QuotationController::class, 'MarkAsSent'])->name('markAsSent');

    // Invoice resource routes (CRUD)
    Route::resource('invoice', InvoiceController::class);
    // Approval flow
    Route::post('/invoice/{invoice}/request-approval', [InvoiceController::class, 'requestApproval'])->name('invoice.request-approval');
    Route::post('/invoice/{invoice}/approve', [InvoiceController::class, 'approve'])->name('invoice.approve');
    Route::post('/invoice/{invoice}/revise', [InvoiceController::class, 'revise'])->name('invoice.revise');
    Route::patch('/invoice/{invoice}/update-status', [InvoiceController::class, 'updateStatus'])->name('invoice.update-status');
    // notif send document(quotation/invoice)email
    Route::post('/send-email/{type}/{id}', [EmailController::class, 'sendDocument'])->name('email.send-document');

    // Payment routes
    Route::prefix('payment')->name('payment.')->group(function () {
        Route::get('/', [PaymentController::class, 'index'])->name('index');
        Route::get('/invoices', [PaymentController::class, 'getInvoices'])->name('get-invoices');
        Route::post('/store', [PaymentController::class, 'store'])->name('store');
        Route::patch('/update/{payment}', [PaymentController::class, 'update'])->name('update');
        Route::delete('/destroy/{payment}', [PaymentController::class, 'destroy'])->name('destroy');
    });

    // Route::get('/email', fn() => Inertia::render('Email/Index'))->name('email.index');
    // Route::get('/user', fn() => Inertia::render('Users/Index'))->name('user.index');
    // Route::get('/project', fn() => Inertia::render('Projects/Index'))->name('project.index');
    // Route::get('/email-inbox', fn() => Inertia::render('Email/Index'))->name('email.index');
    // Route::get('/email', fn() => Inertia::render('Email/Index'))->name('email.inbox');
    Route::prefix('user')->name('user.')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/store', [UserController::class, 'store'])->name('store');
        Route::patch('/update/{id}', [UserController::class, 'update'])->name('update');
        Route::delete('/destroy/{id}', [UserController::class, 'destroy'])->name('destroy');
        Route::post('/send-email/{id}', [UserController::class, 'sendUserEmail'])->name('send-email');
    });

    Route::prefix('email')->name('email.')->group(function () {
        Route::get('/', [EmailController::class, 'index'])->name('index');
        Route::post('/store', [EmailController::class, 'store'])->name('store');
        Route::put('/update/{id}', [EmailController::class, 'update'])->name('update');
        Route::delete('/destroy/{id}', [EmailController::class, 'destroy'])->name('destroy');
    });

    Route::get('/development', function () {
        return Inertia::render('DevelopmentPage');
    })->name('development');

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
        // Proposals Settings
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
    // Projects routes
    Route::resource('projects', ProjectController::class);
    Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus'])
        ->name('projects.status.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // ====================== COMPANY ROUTES ======================
    // Company List & Creation
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::get('/companies/create', [CompanyController::class, 'create'])->name('companies.create');
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    // Untuk Create Company - Get Accepted Quotations
    // Additional company routes untuk Create.jsx
    Route::get('/companies/get-accepted-quotations', [CompanyController::class, 'getAcceptedQuotations']);
    Route::get('/companies/get-lead-from-quotation/{id}', [CompanyController::class, 'getLeadFromQuotation']);
    Route::get('/companies/get-accepted-quotation/{id}', [CompanyController::class, 'getAcceptedQuotation']);    // Company Detail - ROUTE UTAMA untuk halaman profil
    Route::get('/companies/{company}', [CompanyController::class, 'show'])->name('companies.show');
    
    // Company Edit & Update
    Route::get('/companies/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    
    // Delete & Restore routes
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
    Route::delete('/companies/force-delete/{company}', [CompanyController::class, 'forceDelete'])
        ->name('companies.force-delete');
    Route::post('/companies/{company}/restore', [CompanyController::class, 'restore'])
        ->name('companies.restore');
    
    // ====================== COMPANY API DATA ENDPOINTS ======================
    Route::prefix('api/companies/{company}')->group(function () {
        Route::get('/quotations', [CompanyController::class, 'getCompanyQuotations'])
            ->name('companies.quotations.index');
        Route::get('/quotations/summary', [CompanyController::class, 'getQuotationSummary'])
            ->name('companies.quotations.summary');
        Route::get('/quotations/recent', [CompanyController::class, 'getRecentQuotations'])
            ->name('companies.quotations.recent');
        
        Route::get('/invoices', [CompanyController::class, 'getCompanyInvoices'])
            ->name('companies.invoices.index');
        Route::get('/invoices/summary', [CompanyController::class, 'getInvoiceSummary'])
            ->name('companies.invoices.summary');
        Route::get('/invoices/recent', [CompanyController::class, 'getRecentInvoices'])
            ->name('companies.invoices.recent');
        
        Route::get('/statistics', [CompanyController::class, 'getCompanyStatistics'])
            ->name('companies.dashboard.statistics');
        Route::get('/activities', [CompanyController::class, 'getCompanyActivities'])
            ->name('companies.activities');
        Route::get('/documents', [CompanyController::class, 'getCompanyDocuments'])
            ->name('companies.documents');
        Route::get('/contracts', [CompanyController::class, 'getCompanyContracts'])
            ->name('companies.contracts');
        Route::get('/projects', [CompanyController::class, 'getCompanyProjects'])
            ->name('companies.projects');
    });
    
    Route::get('/api/companies/{company}/primary-contact', [CompanyController::class, 'getPrimaryContact'])
        ->name('companies.primary-contact');
    
    // ====================== RELATED ENTITY ROUTES ======================
    Route::prefix('companies/{company}')->group(function () {
        Route::get('/quotations/create', [QuotationController::class, 'createForCompany'])
            ->name('companies.quotations.create');
        Route::post('/quotations', [QuotationController::class, 'storeForCompany'])
            ->name('companies.quotations.store');
    });
    
    // ====================== INVOICE routes (dengan company context) ======================
    Route::prefix('companies/{company}')->group(function () {
        Route::get('/invoices/create', [InvoiceController::class, 'createForCompany'])
            ->name('companies.invoices.create');
        Route::post('/invoices', [InvoiceController::class, 'storeForCompany'])
            ->name('companies.invoices.store');
    });
    
    // ====================== TRASH/ARCHIVE ROUTES ======================
    Route::prefix('companies')->group(function () {
        Route::get('/trash', [CompanyController::class, 'trash'])->name('companies.trash.index');
        Route::get('/trash/{company}', [CompanyController::class, 'showTrashed'])
            ->name('companies.trash.show');
    });
    
    // ====================== EXPORT/IMPORT ROUTES ======================
    Route::prefix('companies')->group(function () {
        Route::get('/export', [CompanyController::class, 'export'])->name('companies.export');
        Route::post('/import', [CompanyController::class, 'import'])->name('companies.import');
        Route::get('/template', [CompanyController::class, 'downloadTemplate'])
            ->name('companies.download-template');
    });
});

// Route untuk halaman tambah proposal
Route::get('/proposal/add', [ProposalController::class, 'add'])->name('proposal.add');
Route::get('/proposal/addProposal/{id}', [ProposalController::class, 'addProposal'])->name('proposal.addProposal');
Route::get('/html-sections', [ProposalController::class, 'sections']);
Route::resource('proposal', ProposalController::class);

require __DIR__.'/auth.php';