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
use App\Http\Controllers\ProposalElementController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\QuotationStatusesController;
use App\Http\Controllers\QuotationNumberFormatted;
use App\Http\Controllers\InvoiceStatusesController;
use App\Http\Controllers\PaymentTypeController;
use App\Http\Controllers\InvoiceNumberFormatted;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TaxController;
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

            Route::prefix('leads')->group(function () {
            Route::get('/', [LeadController::class, 'indexApi']);
            Route::post('/', [LeadController::class, 'store']);
            Route::put('/{id}', [LeadController::class, 'update']);
            Route::delete('/{id}', [LeadController::class, 'destroy']);
            Route::get('/statuses', [LeadController::class, 'getStatuses']);
            Route::get('/user-info', [LeadController::class, 'getCurrentUserInfo']);
            Route::get('/test', [LeadController::class, 'test']);
            
            // Routes untuk contact persons
            Route::post('/{leadId}/sync-contact-person', [LeadController::class, 'syncContactPerson']);
            Route::get('/{leadId}/contact-persons', [LeadController::class, 'getContactPersons']);
    });
    
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
    Route::post('/invoice/status-notify/{id}', [InvoiceController::class, 'notificationUpdateStatus'])->name('invoice.notification-status');
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

        Route::get('/proposal-element/editNama/{id}', [ProposalElementController::class, 'editNama'])->name('proposal-element.editNama');
        Route::resource('proposal-element', ProposalElementController::class);

        // Quotation Settings
        Route::get('/quotations', [SettingController::class, 'quotations'])->name('quotations');
        Route::post('/quotation-status/store', [QuotationStatusesController::class, 'store'])->name('quotation-status.store');
        Route::put('/quotation-status/update/{id}', [QuotationStatusesController::class, 'update'])->name('quotation-status.update');
        Route::delete('/quotation-status/destroy/{id}', [QuotationStatusesController::class, 'destroy'])->name('quotation-status.delete');
        Route::post('/quotation_numbering/update/{id}', [QuotationNumberFormatted::class, 'update'])->name('quotation_numbering.update');

        // Invoice Settings
        Route::get('/invoices', [SettingController::class, 'invoices'])->name('invoices');
        Route::post('/invoice-status/store', [InvoiceStatusesController::class, 'store'])->name('invoice-status.store');
        Route::put('/invoice-status/update/{id}', [InvoiceStatusesController::class, 'update'])->name('invoice-status.update');
        Route::delete('/invoice-status/destroy/{id}', [InvoiceStatusesController::class, 'destroy'])->name('invoice-status.delete');
        Route::post('/invoice_numbering/update/{id}', [InvoiceNumberFormatted::class, 'update'])->name('invoice_numbering.update');
        // Payment Type Settings
        Route::post('/payment-type/store', [PaymentTypeController::class, 'store'])->name('payment-type.store');
        Route::put('/payment-type/update/{id}', [PaymentTypeController::class, 'update'])->name('payment-type.update');
        Route::delete('/payment-type/destroy/{id}', [PaymentTypeController::class, 'destroy'])->name('payment-type.delete');

        // Tax (pph and ppn) Settings
        Route::get('/tax', [SettingController::class, 'tax'])->name('tax');
        // ppn
        Route::post('/ppn/store', [TaxController::class, 'ppnStore'])->name('ppn.store');
        Route::put('/ppn/update/{id}', [TaxController::class, 'ppnUpdate'])->name('ppn.update');
        Route::delete('/ppn/destroy/{id}', [TaxController::class, 'ppnDestroy'])->name('ppn.delete');
        //pph
        Route::post('/pph/store', [TaxController::class, 'pphstore'])->name('pph.store');
        Route::put('/pph/update/{id}', [TaxController::class, 'pphUpdate'])->name('pph.update');
        Route::delete('/pph/destroy/{id}', [TaxController::class, 'pphDestroy'])->name('pph.delete');

        // Email Settings
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
    Route::get('/projects/{project}/edit', [ProjectController::class, 'edit']); 
    Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus'])
        ->name('projects.status.update');
            // Update status route (important!)
    Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus'])
        ->name('projects.status.update');
     // Projects routes
    Route::resource('projects', ProjectController::class);
    
    // API untuk mendapatkan clients dengan nama dari leads
    Route::get('/api/clients', [ProjectController::class, 'getClients']);
    // Atau jika sudah ada route untuk companies, bisa dimodifikasi
    Route::get('/api/companies', [CompanyController::class, 'getClientsForProjects']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    // ====================== COMPANY MAIN ROUTES ======================
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::get('/companies/create', [CompanyController::class, 'create'])->name('companies.create');
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    Route::get('/companies/get-accepted-quotations', [CompanyController::class, 'getAcceptedQuotations']);
    Route::get('/companies/get-lead-from-quotation/{id}', [CompanyController::class, 'getLeadFromQuotation']);
    
    // ====================== COMPANY DETAIL ROUTES ======================
    Route::prefix('companies')->group(function () {
        // Company Detail - ROUTE UTAMA untuk halaman profil
        Route::get('/{company}', [CompanyController::class, 'show'])->name('companies.show');
        
        // Company Edit & Update
        Route::get('/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit');
        Route::put('/{company}', [CompanyController::class, 'update'])->name('companies.update');
        
        // Company Status Update
        Route::patch('/{company}/status', [CompanyController::class, 'updateStatus'])->name('companies.status.update');
        
        // Company Delete & Restore
        Route::delete('/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
        Route::delete('/force-delete/{company}', [CompanyController::class, 'forceDelete'])->name('companies.force-delete');
        Route::post('/{company}/restore', [CompanyController::class, 'restore'])->name('companies.restore');

        // ====================== COMPANY PROJECT ROUTES ======================
        Route::prefix('{company}/projects')->group(function () {
            // Get single project for edit/show (API)
            Route::get('/{project}', [CompanyController::class, 'getProject'])
                ->name('companies.projects.show');
            
            // Edit project page (GET)
            Route::get('/{project}/edit', [CompanyController::class, 'getProject'])
                ->name('companies.projects.edit');
            
            // Update project (PUT/PATCH) - TAMBAHKAN INI JUGA
            Route::put('/{project}', [CompanyController::class, 'updateProject'])
                ->name('companies.projects.update');
            Route::patch('/{project}', [CompanyController::class, 'updateProject'])
                ->name('companies.projects.update.patch'); // opsional
            
            // Delete project
            Route::delete('/{project}', [CompanyController::class, 'destroyProject'])
                ->name('companies.projects.destroy');
        });

        // ====================== COMPANY CONTACT ROUTES ======================
        // ⬇⬇⬇ PASTIKAN INI DI DALAM PREFIX 'companies' ⬇⬇⬇
        Route::prefix('{company}/contacts')->group(function () {
            // Get all contacts for company
            Route::get('/', [CompanyController::class, 'getContacts'])->name('companies.contacts.index');
            
            // Add new contact
            Route::post('/', [CompanyController::class, 'addContact'])->name('companies.contacts.store');
            
            // Update contact
            Route::put('/{contact}', [CompanyController::class, 'updateContact'])->name('companies.contacts.update');
            
            // Delete contact
            Route::delete('/{contact}', [CompanyController::class, 'deleteContact'])->name('companies.contacts.destroy');
            
            // Set as primary contact
            // Route untuk toggle primary (tambahkan ini)
            Route::post('/{contact}/toggle-primary', [CompanyController::class, 'togglePrimary'])
                ->name('companies.contacts.toggle-primary');
            
            // Route untuk set primary (sudah ada)
            Route::post('/{contact}/primary', [CompanyController::class, 'togglePrimary'])
                ->name('companies.contacts.primary');
        });
        
        // ====================== COMPANY PAYMENT ROUTES ======================
        Route::prefix('{company}/payments')->group(function () {
            // Edit/Update payment
            Route::put('/{payment}', [CompanyController::class, 'updatePayment'])->name('companies.payments.update');
            Route::patch('/{payment}', [CompanyController::class, 'updatePayment']);
            
            // Delete payment
            Route::delete('/{payment}', [CompanyController::class, 'destroyPayment'])->name('companies.payments.delete');
            
            // Bulk delete payments
            Route::post('/bulk-delete', [CompanyController::class, 'bulkDeletePayments'])->name('companies.payments.bulk-delete');
        });
        
        // ====================== COMPANY INVOICE ROUTES ======================
        Route::prefix('{company}/invoices')->group(function () {
            // Get invoice
            Route::get('/{invoice}/get', [CompanyController::class, 'getInvoice'])->name('companies.invoices.get');
            
            // Edit invoice
            Route::get('/{invoice}/edit', [CompanyController::class, 'editInvoice'])->name('companies.invoices.edit');
            
            // Update invoice
            Route::put('/{invoice}', [CompanyController::class, 'updateInvoice'])->name('companies.invoices.update');
            
            // Delete invoice
            Route::delete('/{invoice}', [CompanyController::class, 'deleteInvoice'])->name('companies.invoices.delete');
            
            // Bulk delete invoices
            Route::post('/bulk-delete', [CompanyController::class, 'bulkDeleteInvoices'])->name('companies.invoices.bulk-delete');
        });
        
        // ====================== COMPANY QUOTATION ROUTES ======================
        Route::prefix('{company}')->group(function () {
            // Create quotation for company
            Route::get('/quotations/create', [QuotationController::class, 'createForCompany'])->name('companies.quotations.create');
            Route::post('/quotations', [QuotationController::class, 'storeForCompany'])->name('companies.quotations.store');
        });
    });
    
    // ====================== COMPANY API DATA ENDPOINTS ======================
    Route::prefix('api/companies/{company}')->group(function () {
        // Quotation API endpoints
        Route::get('/quotations', [CompanyController::class, 'getCompanyQuotations'])->name('companies.quotations.index');
        Route::get('/quotations/summary', [CompanyController::class, 'getQuotationSummary'])->name('companies.quotations.summary');
        Route::get('/quotations/recent', [CompanyController::class, 'getRecentQuotations'])->name('companies.quotations.recent');
        
        // Invoice API endpoints
        Route::get('/invoices', [CompanyController::class, 'getCompanyInvoices'])->name('companies.invoices.index');
        Route::get('/invoices/summary', [CompanyController::class, 'getInvoiceSummary'])->name('companies.invoices.summary');
        Route::get('/invoices/recent', [CompanyController::class, 'getRecentInvoices'])->name('companies.invoices.recent');
        
        // Other API endpoints
        Route::get('/statistics', [CompanyController::class, 'getCompanyStatistics'])->name('companies.dashboard.statistics');
        Route::get('/activities', [CompanyController::class, 'getCompanyActivities'])->name('companies.activities');
        Route::get('/documents', [CompanyController::class, 'getCompanyDocuments'])->name('companies.documents');
        Route::get('/contracts', [CompanyController::class, 'getCompanyContracts'])->name('companies.contracts');
        Route::get('/projects', [CompanyController::class, 'getCompanyProjects'])->name('companies.projects');
    });
    
    // Primary contact API endpoint
    Route::get('/api/companies/{company}/primary-contact', [CompanyController::class, 'getPrimaryContact'])->name('companies.primary-contact');
});

    // Route untuk edit invoice
Route::get('/invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');

// Route untuk halaman tambah proposal
Route::post('/proposal/add', [ProposalController::class, 'add'])->name('proposal.add');
Route::get('/proposal/addProposal/{id}', [ProposalController::class, 'addProposal'])->name('proposal.addProposal');
Route::get('/html-sections', [ProposalController::class, 'sections']);
Route::get('/proposal/templates', [ProposalController::class, 'templates'])->name('proposal.templates');
Route::resource('proposal', ProposalController::class);

require __DIR__.'/auth.php';