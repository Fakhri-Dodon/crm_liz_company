<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\CompanyContactPerson;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::with(['contactPerson', 'items'])->orderBy('created_at', 'desc')->get();
        $data = $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'number' => $inv->invoice_number,
                'date' => optional($inv->date)->format('Y-m-d') ?? $inv->date,
                'company' => optional($inv->contactPerson)->company_name ?? optional($inv->contactPerson)->name ?? 'N/A',
                'company_id' => $inv->company_contact_persons_id,
                'amount' => (int) $inv->invoice_amout,
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

        return Inertia::render('Invoices/Index', [
            'invoices' => $data,
            'contacts' => $contacts,
        ]);
    }

    public function create()
    {
        $nextNumber = Invoice::count() + 1;
        
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
        
        return Inertia::render('Invoices/Create', [
            'companies' => $companies,
            'leads' => $availableLeads,
            'quotations' => $quotations,
            'nextNumber' => $nextNumber
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
                
                // Get or create company_contact_persons record
                $contactPersonId = null;
                
                if ($validated['client_type'] === 'Lead') {
                    // For Lead, find or create contact person with lead_id
                    $leadId = $validated['company_id'];
                    
                    $contactPerson = CompanyContactPerson::firstOrCreate(
                        ['lead_id' => $leadId, 'deleted' => 0],
                        [
                            'id' => (string) \Str::uuid(),
                            'lead_id' => $leadId,
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
                $invoice = Invoice::create([
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
                    'status'                => 'Draft',
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
        
        return Inertia::render('Invoices/Edit', [
            'invoice' => $invoiceData,
            'companies' => $companies,
            'leads' => $availableLeads,
            'quotations' => $quotations
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
                    
                    $contactPerson = CompanyContactPerson::firstOrCreate(
                        ['lead_id' => $leadId, 'deleted' => 0],
                        [
                            'id' => (string) \Str::uuid(),
                            'lead_id' => $leadId,
                            'is_primary' => 1,
                            'is_active' => 1,
                            'created_by' => auth()->id(),
                        ]
                    );
                    
                    $contactPersonId = $contactPerson->id;
                } else {
                    // For Client, use the contact_person_id sent from frontend
                    $contactPersonId = $validated['contact_person_id'] ?? $validated['company_id'];
                }

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

                return redirect()->route('invoice.index')->with('success', 'Invoice updated successfully');
            });
        } catch (\Exception $e) {
            \Log::error('Invoice update failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update invoice: ' . $e->getMessage()]);
        }
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return redirect()->route('invoice.index')->with('success', 'Invoice deleted');
    }

    public function requestApproval(Invoice $invoice)
    {
        $invoice->status = 'Waiting Approval';
        $invoice->save();
        // TODO: Notifikasi ke manager (bisa pakai event/notification/email)
        return redirect()->route('invoice.index')->with('success', 'Approval requested. Waiting for manager review.');
    }

    public function approve(Invoice $invoice)
    {
        $invoice->status = 'Approved';
        $invoice->save();
        // TODO: Notifikasi ke user (bisa pakai event/notification/email)
        return redirect()->route('invoice.index')->with('success', 'Invoice approved.');
    }

    public function revise(Invoice $invoice)
    {
        $invoice->status = 'Revised';
        $invoice->save();
        // TODO: Notifikasi ke user (bisa pakai event/notification/email)
        return redirect()->route('invoice.index')->with('success', 'Invoice marked as revised.');
    }

    public function updateStatus(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Draft,Unpaid,Paid,Partial,Cancelled'
        ]);

        $invoice->status = $validated['status'];
        $invoice->save();

        return back()->with('success', 'Invoice status updated successfully.');
    }
}
