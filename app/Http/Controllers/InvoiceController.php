<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\CompanyContactPerson;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Quotation;
use App\Models\EmailTemplates;
use App\Models\User;
use App\Models\ActivityLogs;
use App\Models\InvoiceNumberFormated;
use App\Models\InvoiceStatuses;
use App\Models\PaymentType;
use App\Notifications\DocumentNotification;
use App\Mail\SystemMail;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        // Build query and apply filters (search, status, month, year)
        $query = Invoice::with(['contactPerson.company.lead', 'contactPerson.lead', 'items'])->orderBy('created_at', 'desc');

        // Debug log filters (can be removed later)
        \Log::debug('Invoice filters', $request->only('search', 'status', 'month', 'year'));

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                // Search by invoice number
                $q->where('invoice_number', 'like', "%{$search}%")
                  // or by company info on related lead
                  ->orWhereHas('contactPerson.lead', function ($q2) use ($search) {
                      $q2->where('company_name', 'like', "%{$search}%")
                         ->orWhere('contact_person', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  })
                  // or by contact person fields
                  ->orWhereHas('contactPerson', function ($q3) use ($search) {
                      $q3->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('month')) {
            $query->whereMonth('date', $request->month);
        }

        if ($request->filled('year')) {
            $query->whereYear('date', $request->year);
        }

        $invoices = $query->get();
        $data = $invoices->map(function ($inv) {
            // Get company name from the proper source
            $contactPerson = $inv->contactPerson;
            $companyName = 'N/A';
            
            if ($contactPerson) {
                // Check if it's a client (has company_id)
                if ($contactPerson->company_id && $contactPerson->company) {
                    // Get company name from the lead associated with the company
                    $companyName = optional($contactPerson->company->lead)->company_name ?? 'N/A';
                } elseif ($contactPerson->lead_id && $contactPerson->lead) {
                    // Get company name directly from lead
                    $companyName = $contactPerson->lead->company_name ?? 'N/A';
                }
            }
            
            return [
                'id' => $inv->id,
                'number' => $inv->invoice_number,
                'date' => optional($inv->date)->format('Y-m-d') ?? $inv->date,
                'company' => $companyName,
                'company_id' => $inv->company_contact_persons_id,
                'amount' => (int) $inv->invoice_amout,
                // Total includes taxes and represents the full invoice amount
                'total' => (int) $inv->total,
                'paid_amount' => (int) ($inv->total - $inv->amount_due),
                'tax' => [
                    'ppn' => (int) $inv->ppn,
                    'pph' => (int) $inv->pph,
                ],
                'due_amount' => (int) $inv->amount_due,
                'status' => $inv->status,
                'pdf_path' => $inv->pdf_path,
            ];
        });

        // Ambil semua contact person (bisa dioptimasi pagination jika data besar)
        $contacts = CompanyContactPerson::orderBy('id')->get();

        // Ambil statuses dari setting agar bisa dipakai di page
        $statuses = InvoiceStatuses::where('deleted', 0)->orderBy('order', 'asc')->get()->map(function($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'note' => $s->note,
                'color' => $s->color,
                'color_name' => $s->color_name,
                'is_system' => (bool) $s->is_system,
            ];
        });

        return Inertia::render('Invoices/Index', [
            'invoices' => $data,
            'contacts' => $contacts,
            'auth_permissions' => auth()->user()->getPermissions('INVOICE'),
            'statuses' => $statuses,
        ]);
    }

    public function create()
    {
        // Prefer using formatted invoice settings if available
        $fmt = InvoiceNumberFormated::first();
        $nextNumber = $fmt ? $fmt : Invoice::count() + 1;
        
        // Get leads that are not yet companies
        $existingLeadIds = Company::where('deleted', 0)
            ->whereNotNull('lead_id')
            ->pluck('lead_id');
            
        $availableLeads = Lead::where('deleted', 0)
            ->whereNotIn('id', $existingLeadIds)
            ->select(['id', 'company_name', 'address', 'contact_person', 'email', 'phone'])
            ->get();
            
        // Get companies with their contact persons
        $companies = Company::where('deleted', 0)
            ->with([
                'contactPersons.lead', 
                'lead'
            ])
            ->get();
            
        // Get accepted quotations
        $quotations = Quotation::where('deleted', 0)
            ->where('status', 'accepted')
            ->with('lead')
            ->select(['id', 'quotation_number as no', 'lead_id'])
            ->get()
            ->map(function($q) {
                return [
                    'id' => $q->id,
                    'no' => $q->no,
                    'lead_id' => $q->lead_id,
                    'company_name' => $q->lead ? $q->lead->company_name : null,
                    'lead' => $q->lead ? [
                        'company_name' => $q->lead->company_name
                    ] : null
                ];
            });
        
        // Load available payment types
        $paymentTypes = PaymentType::where('deleted', 0)
            ->orderBy('order', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                ];
            });

        // Load available tax settings
        $ppnOptions = \App\Models\Ppn::active()->get()->map(function($t) { return ['id' => $t->id, 'name' => $t->name, 'rate' => (float)$t->rate]; });
        $pphOptions = \App\Models\Pph::active()->get()->map(function($t) { return ['id' => $t->id, 'name' => $t->name, 'rate' => (float)$t->rate]; });
        
        return Inertia::render('Invoices/Create', [
            'companies' => $companies,
            'leads' => $availableLeads,
            'quotations' => $quotations,
            'nextNumber' => $nextNumber,
            'paymentTypes' => $paymentTypes,
            'ppn' => $ppnOptions,
            'pph' => $pphOptions,
        ]);
    }

    public function store(Request $request)
    {
        // Decode services if it's JSON string
        if ($request->has('services') && is_string($request->services)) {
            $decoded = json_decode($request->services, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['services' => $decoded]);
                \Log::info('Services decoded successfully', ['count' => count($decoded)]);
            } else {
                \Log::error('Failed to decode services JSON', ['error' => json_last_error_msg()]);
            }
        }

        $validated = $request->validate([
            'client_type'           => 'required|string',
            'company_id'            => 'required',
            'contact_person_id'     => 'nullable|string',  // Added this
            'number'                => 'required|string',
            'date'                  => 'required|date',
            'quotation_id'          => 'nullable|string',
            'payment_terms'         => 'nullable|string',
            'payment_type'          => 'nullable|string',
            'payment_percentage'    => 'nullable|numeric',
            'note'                  => 'nullable|string',
            'sub_total'             => 'required|numeric',
            'ppn'                   => 'nullable|numeric',
            'pph'                   => 'nullable|numeric',
            'tax_amount_ppn'        => 'nullable|numeric',
            'tax_amount_pph'        => 'nullable|numeric',
            'down_payment'          => 'nullable|numeric',
            'total'                 => 'required|numeric',
            'pdf_file'              => 'required|mimes:pdf|max:5120',
            'services'              => 'required|array|min:1',
        ]);

        try {
            return \DB::transaction(function () use ($request, $validated) {
                // Store PDF
                $path = $request->file('pdf_file')->store('invoices', 'public');
                \Log::info('Invoice PDF stored at: ' . $path);
                
                // Get or create company_contact_persons record
                $contactPersonId = null;
                
                if ($validated['client_type'] === 'Lead') {
                    // For Lead, find or create contact person with lead_id
                    $leadId = $validated['company_id'];
                    // Get lead to populate name/email/phone if available
                    $lead = Lead::find($leadId);
                    
                    $contactPerson = CompanyContactPerson::firstOrCreate(
                        ['lead_id' => $leadId, 'deleted' => 0],
                        [
                            'id' => (string) \Str::uuid(),
                            'lead_id' => $leadId,
                            'name' => $lead ? ($lead->contact_person ?? $lead->company_name) : '',
                            'email' => $lead ? ($lead->email ?? '') : '',
                            'phone' => $lead ? ($lead->phone ?? '') : '',
                            'is_primary' => 1,
                            'is_active' => 1,
                            'created_by' => auth()->id(),
                        ]
                    );
                    
                    $contactPersonId = $contactPerson->id;
                } else {
                    // For Client, use the contact_person_id sent from frontend
                    // Frontend sends actual company_contact_persons.id
                    $contactPersonId = $validated['contact_person_id'] ?? $validated['company_id'];
                }

                // Create invoice
                // attach formatted number if setting exists
                $fmt = InvoiceNumberFormated::first();
                $fmtId = $fmt ? $fmt->id : null;
                $invoiceNumber = $fmt ? InvoiceNumberFormated::generate() : $validated['number'];

                // Prefer 'Unpaid' status when creating invoices; fallback to 'Draft' when not available
                $statusModel = \App\Models\InvoiceStatuses::where('name', 'Unpaid')->first() ?? \App\Models\InvoiceStatuses::where('name', 'Draft')->first();
                $statusId = $statusModel ? $statusModel->id : null;
                $statusName = $statusModel ? $statusModel->name : 'Draft';

                $invoice = Invoice::create([
                    'company_contact_persons_id' => $contactPersonId,
                    'quotation_id'          => $validated['quotation_id'] ?: null,
                    'invoice_number_formated_id' => $fmtId,
                    'invoice_statuses_id'  => $statusId,
                    'invoice_number'        => $invoiceNumber,
                    'date'                  => $validated['date'],
                    'invoice_amout'         => $validated['sub_total'],
                    'payment_terms'         => $validated['payment_terms'] ?? '',
                    'payment_type'          => $validated['payment_type'] ?? '',
                    'payment_percentage'    => $validated['payment_percentage'] ?? 0,
                    'note'                  => $validated['note'] ?? '',
                    'ppn'                   => $validated['tax_amount_ppn'] ?? 0,
                    'pph'                   => $validated['tax_amount_pph'] ?? 0,
                    'total'                 => $validated['total'],
                    'amount_due'            => $validated['total'],
                    'status'                => $statusName,
                    'pdf_path'              => $path,
                    'created_by'            => auth()->id(),
                ]);

                // Create invoice items
                foreach ($validated['services'] as $item) {
                    // Combine name and processing into services field
                    $serviceText = $item['name'];
                    if (!empty($item['processing'])) {
                        $serviceText .= ' - ' . $item['processing'];
                    }
                    
                    InvoiceItem::create([
                        'invoice_id'    => $invoice->id,
                        'services'      => $serviceText,
                        'amount'        => $item['price'],
                        'created_by'    => auth()->id(),
                    ]);
                }

                $selectedContact = \App\Models\CompanyContactPerson::find($request->contact_person_id);

                // Notify managers about new invoice (like quotations)
                $managers = User::whereHas('role', function($q) {
                    $q->where('name', 'manager');
                })->get();

                foreach ($managers as $manager) {
                    $manager->notifications()
                            ->where('data->id', (string)$invoice->id)
                            ->where('data->type', 'invoice')
                            ->delete();

                    $manager->notify(new DocumentNotification([
                        'id'               => $invoice->id,
                        'type'             => 'invoice',
                        'status'           => $statusName,
                        'url'              => "/storage/{$invoice->pdf_path}",
                        'message'          => "Invoice baru #{$invoice->invoice_number} menunggu persetujuan.",
                        'contact_person'   => $selectedContact->name ?? 'No Name',
                        'email'            => $selectedContact->email ?? null,
                    ]));
                }

                ActivityLogs::create([
                    'user_id' => auth()->id(),
                    'module' => 'Invoices',
                    'action' => 'Created',
                    'description' => 'Create New Invoice: ' . $invoice->invoice_number,
                ]);

                return redirect()->route('invoice.index')->with('success', 'Invoice created successfully');
            });
        } catch (\Exception $e) {
            \Log::error('Invoice creation failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to create invoice: ' . $e->getMessage()]);
        }
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['contactPerson', 'items']);
        
        // Format invoice data for the view
        $contactPerson = $invoice->contactPerson;
        $isClient = $contactPerson && $contactPerson->company_id !== null;
        
        // Get lead or company data
        $lead = null;
        $company = null;
        
        if ($isClient && $contactPerson->company_id) {
            $company = Company::with('lead')->find($contactPerson->company_id);
            $lead = $company ? $company->lead : null;
        } elseif ($contactPerson && $contactPerson->lead_id) {
            $lead = Lead::find($contactPerson->lead_id);
        }
        
        $invoiceData = [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'date' => $invoice->date,
            'company_name' => $lead ? $lead->company_name : '',
            'address' => $lead ? $lead->address : '',
            'contact_person' => $lead ? $lead->contact_person : '',
            'position' => $contactPerson ? $contactPerson->position : '',
            'email' => $lead ? $lead->email : '',
            'phone' => $lead ? $lead->phone : '',
            'quotation_id' => $invoice->quotation_id,
            'payment_type' => $invoice->payment_type,
            'payment_percentage' => (float) $invoice->payment_percentage,
            'payment_terms' => $invoice->payment_terms,
            'note' => $invoice->note,
            'items' => $invoice->items,
            'invoice_amout' => (float) $invoice->invoice_amout,
            'ppn' => (float) $invoice->ppn,
            'pph' => (float) $invoice->pph,
            'total' => (float) $invoice->total,
            'amount_due' => (float) $invoice->amount_due,
            'down_payment' => (float) $invoice->invoice_amout * (float) $invoice->payment_percentage,
            'status' => $invoice->status,
            'pdf_path' => $invoice->pdf_path,
        ];
        
        return Inertia::render('Invoices/Show', ['invoice' => $invoiceData]);
    }

    public function edit(Invoice $invoice)
    {
        $invoice->load(['contactPerson', 'items']);
        
        // Format invoice data for Edit page
        $contactPerson = $invoice->contactPerson;
        $isClient = $contactPerson && $contactPerson->company_id !== null;
        
        // Get lead or company data
        $lead = null;
        $company = null;
        
        if ($isClient && $contactPerson->company_id) {
            $company = Company::with('lead')->find($contactPerson->company_id);
            $lead = $company ? $company->lead : null;
        } elseif ($contactPerson && $contactPerson->lead_id) {
            $lead = Lead::find($contactPerson->lead_id);
        }
        
        // Format invoice items for frontend (services array)
        $services = $invoice->items->map(function($item) {
            // Parse services string back to name and processing
            $serviceParts = explode(' - ', $item->services, 2);
            return [
                'id' => $item->id,
                'name' => $serviceParts[0] ?? $item->services,
                'processing' => $serviceParts[1] ?? '',
                'price' => (float) $item->amount,
            ];
        })->toArray();
        
        $invoiceData = [
            'id' => $invoice->id,
            'is_client' => $isClient,
            'invoice_number' => $invoice->invoice_number,
            'date' => $invoice->date,
            'company_id' => $isClient ? ($company ? $company->id : null) : ($lead ? $lead->id : null),
            'company_name' => $lead ? $lead->company_name : '',
            'address' => $lead ? $lead->address : '',
            'contact_person' => $lead ? $lead->contact_person : '',
            'contact_person_id' => $contactPerson ? $contactPerson->id : null,
            'position' => $contactPerson ? $contactPerson->position : '',
            'email' => $lead ? $lead->email : '',
            'phone' => $lead ? $lead->phone : '',
            'quotation_id' => $invoice->quotation_id,
            'payment_type' => $invoice->payment_type,
            'payment_percentage' => (float) $invoice->payment_percentage,
            'payment_terms' => $invoice->payment_terms,
            'note' => $invoice->note,
            'invoice_items' => $services,
            'ppn' => (float) $invoice->ppn / ($invoice->invoice_amout ?: 1), // Convert back to rate
            'pph' => (float) $invoice->pph / ($invoice->invoice_amout ?: 1), // Convert back to rate
            'sub_total' => (float) $invoice->invoice_amout,
            'tax_amount_ppn' => (float) $invoice->ppn,
            'tax_amount_pph' => (float) $invoice->pph,
            'total' => (float) $invoice->total,
            'down_payment' => (float) $invoice->invoice_amout * (float) $invoice->payment_percentage,
            'pdf_path' => $invoice->pdf_path,
        ];
        
        // Get leads that are not yet companies
        $existingLeadIds = Company::where('deleted', 0)
            ->whereNotNull('lead_id')
            ->pluck('lead_id');
            
        $availableLeads = Lead::where('deleted', 0)
            ->whereNotIn('id', $existingLeadIds)
            ->select(['id', 'company_name', 'address', 'contact_person', 'email', 'phone'])
            ->get();
            
        // Get companies with their contact persons
        $companies = Company::where('deleted', 0)
            ->with([
                'contactPersons.lead', 
                'lead'
            ])
            ->get();
            
        // Get accepted quotations
        $quotations = Quotation::where('deleted', 0)
            ->where('status', 'accepted')
            ->with('lead')
            ->select(['id', 'quotation_number as no', 'lead_id'])
            ->get()
            ->map(function($q) {
                return [
                    'id' => $q->id,
                    'no' => $q->no,
                    'lead_id' => $q->lead_id,
                    'company_name' => $q->lead ? $q->lead->company_name : null,
                    'lead' => $q->lead ? [
                        'company_name' => $q->lead->company_name
                    ] : null
                ];
            });
        
        // Load available payment types
        $paymentTypes = PaymentType::where('deleted', 0)
            ->orderBy('order', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                ];
            });

        // Load available tax settings
        $ppnOptions = \App\Models\Ppn::active()->get()->map(function($t) { return ['id' => $t->id, 'name' => $t->name, 'rate' => (float)$t->rate]; });
        $pphOptions = \App\Models\Pph::active()->get()->map(function($t) { return ['id' => $t->id, 'name' => $t->name, 'rate' => (float)$t->rate]; });

        return Inertia::render('Invoices/Edit', [
            'invoice' => $invoiceData,
            'companies' => $companies,
            'leads' => $availableLeads,
            'quotations' => $quotations,
            'paymentTypes' => $paymentTypes,
            'ppn' => $ppnOptions,
            'pph' => $pphOptions,
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        // Decode services if it's JSON string
        if ($request->has('services') && is_string($request->services)) {
            $decoded = json_decode($request->services, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['services' => $decoded]);
            }
        }

        $validated = $request->validate([
            'client_type'           => 'required|string',
            'company_id'            => 'required',
            'contact_person_id'     => 'nullable|string',
            'number'                => 'required|string',
            'date'                  => 'required|date',
            'quotation_id'          => 'nullable|string',
            'payment_terms'         => 'nullable|string',
            'payment_type'          => 'nullable|string',
            'payment_percentage'    => 'nullable|numeric',
            'note'                  => 'nullable|string',
            'sub_total'             => 'required|numeric',
            'ppn'                   => 'nullable|numeric',
            'pph'                   => 'nullable|numeric',
            'tax_amount_ppn'        => 'nullable|numeric',
            'tax_amount_pph'        => 'nullable|numeric',
            'down_payment'          => 'nullable|numeric',
            'total'                 => 'required|numeric',
            'pdf_file'              => 'nullable|mimes:pdf|max:5120',
            'services'              => 'required|array|min:1',
        ]);

        try {
            return \DB::transaction(function () use ($request, $validated, $invoice) {
                // Get or create company_contact_persons record
                $contactPersonId = null;
                
                if ($validated['client_type'] === 'Lead') {
                    // For Lead, find or create contact person with lead_id
                    $leadId = $validated['company_id'];
                    // Get lead to populate name/email/phone if available
                    $lead = Lead::find($leadId);
                    
                    $contactPerson = CompanyContactPerson::firstOrCreate(
                        ['lead_id' => $leadId, 'deleted' => 0],
                        [
                            'id' => (string) \Str::uuid(),
                            'lead_id' => $leadId,
                            'name' => $lead ? ($lead->contact_person ?? $lead->company_name) : '',
                            'email' => $lead ? ($lead->email ?? '') : '',
                            'phone' => $lead ? ($lead->phone ?? '') : '',
                            'is_primary' => 1,
                            'is_active' => 1,
                            'created_by' => $invoice->created_by, // ✅ AMBIL DARI CREATOR
                        ]
                    );
                    
                    $contactPersonId = $contactPerson->id;
                } else {
                    // For Client, use the contact_person_id sent from frontend
                    $contactPersonId = $validated['contact_person_id'] ?? $validated['company_id'];
                }

                // If a new PDF is uploaded during update, store it and set pdf_path
                if ($request->hasFile('pdf_file')) {
                    $path = $request->file('pdf_file')->store('invoices', 'public');
                    \Log::info('Updated invoice PDF stored at: ' . $path);

                    // Delete old PDF file from storage if it exists and is different
                    try {
                        $oldPath = $invoice->pdf_path;
                        if (!empty($oldPath) && Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->delete($oldPath);
                            \Log::info('Deleted old invoice PDF: ' . $oldPath);
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Failed to delete old invoice PDF: ' . $e->getMessage());
                    }

                    $validated['pdf_path'] = $path;
                }

                // Get status
                $statusModel = \App\Models\InvoiceStatuses::where('name', 'Unpaid')->first() ?? \App\Models\InvoiceStatuses::where('name', 'Draft')->first();
                $statusId = $statusModel ? $statusModel->id : null;
                $statusName = $statusModel ? $statusModel->name : 'Draft'; // ✅ VARIABLE YANG BENAR

                // Update invoice
                $invoice->update([
                    'company_contact_persons_id' => $contactPersonId,
                    'quotation_id'          => $validated['quotation_id'] ?: null,
                    'invoice_number'        => $validated['number'],
                    'date'                  => $validated['date'],
                    'invoice_amout'         => $validated['sub_total'],
                    'payment_terms'         => $validated['payment_terms'] ?? '',
                    'payment_type'          => $validated['payment_type'] ?? '',
                    'payment_percentage'    => $validated['payment_percentage'] ?? 0,
                    'note'                  => $validated['note'] ?? '',
                    'ppn'                   => $validated['tax_amount_ppn'] ?? 0,
                    'pph'                   => $validated['tax_amount_pph'] ?? 0,
                    'total'                 => $validated['total'],
                    'amount_due'            => $validated['total'],
                    'invoice_statuses_id'   => $statusId,
                    'status'                => $statusName,
                    'pdf_path'              => $validated['pdf_path'] ?? $invoice->pdf_path,
                    'updated_by'            => auth()->id(),
                ]);

                // Delete old items and create new ones
                $invoice->items()->delete();
                foreach ($validated['services'] as $item) {
                    // Combine name and processing into services field
                    $serviceText = $item['name'];
                    if (!empty($item['processing'])) {
                        $serviceText .= ' - ' . $item['processing'];
                    }
                    
                    InvoiceItem::create([
                        'invoice_id'    => $invoice->id,
                        'services'      => $serviceText,
                        'amount'        => $item['price'],
                        'created_by'    => auth()->id(),
                    ]);
                }

                auth()->user()->notifications()
                    ->where('data->id', $invoice->id)
                    ->delete();

                $selectedContact = \App\Models\CompanyContactPerson::find($request->contact_person_id);

                $managers = User::whereHas('role', function($q) {
                    $q->where('name', 'manager');
                })->get();

                foreach ($managers as $manager) {
                    $manager->notifications()
                            ->where('data->id', (string)$invoice->id)
                            ->where('data->type', 'invoice')
                            ->delete();

                    $manager->notify(new DocumentNotification([
                        'id'               => $invoice->id,
                        'type'             => 'invoice',
                        'status'           => $invoice->status,
                        'url'              => "/storage/{$invoice->pdf_path}",
                        'message'          => "Invoice #{$invoice->invoice_number} telah diperbarui dan siap di-review ulang.",
                        'contact_person'   => $selectedContact->name ?? 'No Name',
                        'email'            => $selectedContact->email ?? null,
                    ]));
                }

                ActivityLogs::create([
                    'user_id' => auth()->id(),
                    'module' => 'Invoices',
                    'action' => 'Updated',
                    'description' => 'Update Invoice: ' . $invoice->invoice_number,
                ]);

                return redirect()->route('invoice.index')->with('success', 'Invoice updated successfully');
            });
        } catch (\Exception $e) {
            \Log::error('Invoice update failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update invoice: ' . $e->getMessage()]);
        }
    }

    public function destroy(Invoice $invoice)
    {
        // Delete associated PDF file if exists
        try {
            if (!empty($invoice->pdf_path) && Storage::disk('public')->exists($invoice->pdf_path)) {
                Storage::disk('public')->delete($invoice->pdf_path);
                \Log::info('Deleted invoice PDF during destroy: ' . $invoice->pdf_path);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to delete invoice PDF during destroy: ' . $e->getMessage());
        }

        // Soft-delete related payments (set deleted flag and soft-delete so existing flows remain intact)
        try {
            $payments = $invoice->payments()->where('deleted', 0)->get();
            foreach ($payments as $payment) {
                $payment->update([ 'deleted' => 1, 'deleted_by' => auth()->id() ]);
                $payment->delete(); // triggers SoftDeletes
                \Log::info('Deleted payment during invoice destroy: ' . $payment->id);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to delete related payments during invoice destroy: ' . $e->getMessage());
        }

        $invoice->delete();
        return redirect()->route('invoice.index')->with('success', 'Invoice deleted');
    }

    public function requestApproval(Invoice $invoice)
    {
        $invoice->status = 'Waiting Approval';
        $invoice->save();

        // Notify managers
        $managers = User::whereHas('role', function($q) {
            $q->where('name', 'manager');
        })->get();

        foreach ($managers as $manager) {
            $manager->notifications()
                    ->where('data->id', (string)$invoice->id)
                    ->where('data->type', 'invoice')
                    ->delete();

            $manager->notify(new DocumentNotification([
                'id' => $invoice->id,
                'type' => 'invoice',
                'status' => $invoice->status,
                'url' => "/invoices/show/{$invoice->id}",
                'message' => "Invoice #{$invoice->invoice_number} meminta approval.",
                'contact_person' => $invoice->contactPerson && ($invoice->contactPerson->name ?? null) ? ($invoice->contactPerson->name ?? ($invoice->contactPerson->lead->contact_person ?? 'No Name')) : ($invoice->contactPerson && $invoice->contactPerson->lead ? $invoice->contactPerson->lead->contact_person : 'No Name'),
                'email' => $invoice->contactPerson && ($invoice->contactPerson->email ?? null) ? ($invoice->contactPerson->email ?? ($invoice->contactPerson->lead->email ?? null)) : ($invoice->contactPerson && $invoice->contactPerson->lead ? $invoice->contactPerson->lead->email : null),
            ]));
        }

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Invoices',
            'action' => 'Requested Approval',
            'description' => 'Request Approval Invoice: ' . $invoice->invoice_number,
        ]);

        return redirect()->route('invoice.index')->with('success', 'Approval requested. Waiting for manager review.');
    }

    public function approve(Invoice $invoice)
    {
        $invoice->status = 'Approved';
        $invoice->save();

        // Notify creator
        $creator = $invoice->creator ?? null;
        if ($creator) {
            $creator->notifications()
                    ->where('data->id', (string)$invoice->id)
                    ->delete();

            $contactPerson = $invoice->contactPerson && $invoice->contactPerson->lead ? $invoice->contactPerson->lead->contact_person : ($invoice->contactPerson->name ?? 'No Name');
            $contactEmail = $invoice->contactPerson && $invoice->contactPerson->lead ? $invoice->contactPerson->lead->email : ($invoice->contactPerson->email ?? null);

            $creator->notify(new DocumentNotification([
                'id' => $invoice->id,
                'message' => "Invoice #{$invoice->invoice_number} telah di-approved",
                'url' => "/invoices/show/{$invoice->id}",
                'type' => 'invoice',
                'status' => 'Approved',
                'contact_person' => $contactPerson,
                'email' => $contactEmail,
            ]));
        }

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Invoices',
            'action' => 'Approved',
            'description' => 'Approve Invoice: ' . $invoice->invoice_number,
        ]);

        return redirect()->route('invoice.index')->with('success', 'Invoice approved.');
    }

    public function revise(Invoice $invoice)
    {
        $invoice->status = 'Revised';
        $invoice->save();

        // Notify creator
        $creator = $invoice->creator ?? null;
        if ($creator) {
            $creator->notifications()
                    ->where('data->id', (string)$invoice->id)
                    ->delete();

            $contactPerson = $invoice->contactPerson && $invoice->contactPerson->lead ? $invoice->contactPerson->lead->contact_person : ($invoice->contactPerson->name ?? 'No Name');
            $contactEmail = $invoice->contactPerson && $invoice->contactPerson->lead ? $invoice->contactPerson->lead->email : ($invoice->contactPerson->email ?? null);

            $creator->notify(new DocumentNotification([
                'id' => $invoice->id,
                'message' => "Invoice #{$invoice->invoice_number} telah di-revised",
                'url' => "/invoices/edit/{$invoice->id}",
                'type' => 'invoice',
                'status' => 'Revised',
                'contact_person' => $contactPerson,
                'email' => $contactEmail,
            ]));
        }

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Invoices',
            'action' => 'Revised',
            'description' => 'Revise Invoice: ' . $invoice->invoice_number,
        ]);

        return redirect()->route('invoice.index')->with('success', 'Invoice marked as revised.');
    }

    public function updateStatus(Request $request, Invoice $invoice)
    {
        // Accept either a status name or a status_id (from InvoiceStatuses table).
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'status_id' => 'sometimes|exists:invoice_statuses,id'
        ]);

        $statusObj = null;

        if (!empty($validated['status_id'])) {
            $statusObj = InvoiceStatuses::find($validated['status_id']);
        } elseif (!empty($validated['status'])) {
            // Match by name (case-sensitive as stored in DB)
            $statusObj = InvoiceStatuses::where('name', $validated['status'])->first();
        }

        if (!$statusObj) {
            return back()->withErrors(['status' => 'Invalid status'])->withInput();
        }

        // Persist both the FK and the readable name
        $invoice->invoice_statuses_id = $statusObj->id;
        $invoice->status = $statusObj->name;
        $invoice->save();

        return redirect()->back()->with('success', 'Invoice status updated successfully.');
    }

    public function markAsSent(Request $request, $id)
    {
        $request->validate([
            'template_id' => 'required|exists:email_templates,id',
            'type'        => 'required|in:quotation,invoice,proposal'
        ]);

        try {
            $docType = $request->type;
            $modelMap = [
                'quotation' => \App\Models\Quotation::class,
                'invoice'   => \App\Models\Invoice::class,
                'proposal'  => \App\Models\Proposal::class,
            ];

            $model = $modelMap[$docType];
            $document = $model::with(['lead', 'contactPerson.lead'])->findOrFail($id);
            $template = EmailTemplates::findOrFail($request->template_id);

            $filePath = null;
            $link = '#';

            if ($docType === 'proposal') {
                $link = url("/proposals/view/" . $document->slug);
            } else {
                $filePath = $document->pdf_path;
                $link = asset('storage/' . $filePath);
            }

            $placeholders = [
                '{name}'    => $document->lead->contact_person ?? ($document->contactPerson->name ?? '-'),
                '{company}' => $document->lead->company_name ?? ($document->contactPerson && $document->contactPerson->lead ? $document->contactPerson->lead->company_name : '-'),
                '{id}'      => $document->quotation_number ?? $document->invoice_number ?? $document->number ?? '-',
                '{total}'   => number_format($document->total ?? 0, 0, ',', '.'),
                '{link}'    => '<a href="'.$link.'" style="color: #3182ce; font-weight: bold;">Klik di Sini</a>',
            ];

            $finalSubject = str_replace(array_keys($placeholders), array_values($placeholders), $template->subject);
            $finalContent = str_replace(array_keys($placeholders), array_values($placeholders), $template->content);

            $recipientEmail = $document->lead->email ?? ($document->contactPerson->email ?? ($document->contactPerson && $document->contactPerson->lead ? $document->contactPerson->lead->email : null));
            if (!$recipientEmail) {
                return back()->with('error', 'Gagal: Email tujuan tidak ditemukan.');
            }

            Mail::to($recipientEmail)
                ->send(new SystemMail($finalSubject, $finalContent, $filePath));

            $document->update(['status' => 'sent']);

            auth()->user()->notifications()
                ->where('data->id', (string)$id)
                ->where('data->type', $docType)
                ->delete();

            return back()->with('success', ucfirst($docType) . ' berhasil dikirim!');

        } catch (\Exception $e) {
            \Log::error("Gagal kirim {$request->type}: " . $e->getMessage());
            return back()->with('error', 'Gagal mengirim email: ' . $e->getMessage());
        }
    }

    public function notificationUpdateStatus(Request $request, $id) 
    {
        // dd("notif", $request->all());

        $request->validate([
            'status' => 'required|in:draft,approved,revised,sent,accepted,expired,rejected',
            'revision_note' => 'required_if:status,revised'
        ]);

        $status = InvoiceStatuses::where('name', $request->status)->first();

        if (!$status) {
            return back()->withErrors(['status' => 'Status tidak valid']);
        }

        $invoice = Invoice::where('id', $id)->where('deleted', 0)->firstOrFail();

        $updateData = [
            'status' => $request->status, 
            'invoice_statuses_id' => $status->id,
        ];
        if ($request->status === 'revised') {
            $updateData['revision_note'] = $request->revision_note;
        }

        $invoice->update($updateData);

        auth()->user()->notifications()
            ->where('data->id', $id)
            ->delete();

        $creator = $invoice->creator;

        if($creator) {
            $creator->notifications()
                    ->where('data->id', (string)$id)
                    ->delete();
            $msg = "Invoice #{$invoice->invoice_number} telah di-{$request->status}";

            if ($request->status === 'revised' && $request->revision_note) {
                $msg .= ": " . $request->revision_note;

            }

            $contactPerson = $invoice->contactPerson->name ?? 'No Name';
            $contactEmail = $invoice->contactPerson->email ?? null;

            $creator->notify(new DocumentNotification([
                'id'     => $invoice->id,
                'message' => $msg,
                'url' => "/Invoice/edit/{$id}",
                'type' => 'invoice',
                'revision_note' => $request->revision_note,
                'status'  => $request->status,
                'contact_person' => $contactPerson,
                'email'          => $contactEmail,
            ]));
        }

        return back();
    }
}
