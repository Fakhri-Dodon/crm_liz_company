<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Lead;
use App\Models\ClientType;
use App\Models\Quotation;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Project;
use App\Models\CompanyContactPerson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    /**
     * Display a listing of companies.
     */
    public function index(Request $request)
    {
        try {
            \Log::info('Companies index accessed - AUTH USER: ' . auth()->id());
            
            // Pastikan user authenticated
            if (!auth()->check()) {
                \Log::warning('User not authenticated, redirecting to login');
                return redirect()->route('login');
            }
            
            // Query companies dengan relasi
            $query = Company::with(['clientType', 'primaryContact'])
                ->orderBy('created_at', 'desc');

            // Apply search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('client_code', 'like', "%{$search}%")
                      ->orWhereHas('primaryContact', function($subQuery) use ($search) {
                          $subQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%")
                                   ->orWhere('phone', 'like', "%{$search}%");
                      });
                });
            }

            // Apply client type filter
            if ($request->has('client_type_id') && !empty($request->client_type_id)) {
                $query->where('client_type_id', $request->client_type_id);
            }

            // Get statistics
            $totalClients = Company::count();
            $activeClients = Company::where('is_active', true)->count();
            $inactiveClients = Company::where('is_active', false)->count();
            
            // Get client types with counts
            $clientTypes = ClientType::withCount(['companies' => function($query) {
                $query->where('deleted', 0);
            }])->get();

            // Paginate results
            $perPage = $request->get('per_page', 15);
            $companies = $query->paginate($perPage)->withQueryString();

            \Log::info('Companies fetched: ' . $companies->total());

            // **PERBAIKAN UTAMA: Format companies data untuk Inertia**
            $formattedCompanies = $companies->through(function($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->client_code, // Nama perusahaan = client_code
                    'client_code' => $company->client_code,
                    'client_type_name' => $company->clientType->name ?? 'N/A',
                    'client_type_id' => $company->client_type_id,
                    // Data contact person dari primary contact
                    'contact_person' => $company->primaryContact ? $company->primaryContact->name : 'N/A',
                    'email' => $company->primaryContact ? $company->primaryContact->email : 'N/A',
                    'phone' => $company->primaryContact ? $company->primaryContact->phone : 'N/A',
                    'position' => $company->primaryContact ? $company->primaryContact->position : 'Contact Person',
                    'address' => trim(implode(', ', array_filter([
                        $company->city,
                        $company->province,
                        $company->country
                    ])), ', '),
                    'city' => $company->city,
                    'province' => $company->province,
                    'country' => $company->country,
                    'postal_code' => $company->postal_code,
                    'is_active' => (bool) $company->is_active,
                    'client_since' => $company->client_since ? $company->client_since->format('Y-m-d') : null,
                    'created_at' => $company->created_at,
                    'updated_at' => $company->updated_at,
                    'logo_url' => $company->logo_path ? Storage::url($company->logo_path) : null,
                    // Additional info
                    'vat_number' => $company->vat_number,
                    'nib' => $company->nib,
                    'website' => $company->website,
                    // Primary contact object untuk konsistensi
                    'primary_contact' => $company->primaryContact ? [
                        'name' => $company->primaryContact->name,
                        'email' => $company->primaryContact->email,
                        'phone' => $company->primaryContact->phone,
                        'position' => $company->primaryContact->position
                    ] : null
                ];
            });

            // Prepare statistics array
            $statistics = [
                'total' => $totalClients,
                'active' => $activeClients,
                'inactive' => $inactiveClients,
                'client_types' => $clientTypes->map(function($type) {
                    return [
                        'id' => $type->id,
                        'name' => $type->name,
                        'label' => $type->information ?? $type->name,
                        'count' => $type->companies_count ?? 0
                    ];
                })
            ];

            // Get all client types for filter
            $types = ClientType::all()->map(function($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'information' => $type->information,
                    'created_at' => $type->created_at,
                    'updated_at' => $type->updated_at
                ];
            });

            // Check if coming from quotation
            $fromQuotation = $request->has('from_quotation') && $request->from_quotation == 'true';
            $quotationId = $request->get('quotation_id');

            return Inertia::render('Companies/Index', [
                'companies' => $formattedCompanies, // **Gunakan formattedCompanies**
                'statistics' => $statistics,
                'types' => $types,
                'filters' => [
                    'search' => $request->search ?? '',
                    'client_type_id' => $request->client_type_id ?? ''
                ],
                'fromQuotation' => $fromQuotation,
                'quotationId' => $quotationId
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in companies index: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            \Log::error('User ID: ' . (auth()->check() ? auth()->id() : 'Not authenticated'));
            
            // Return error response
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load companies: ' . $e->getMessage()
                ], 500);
            }
            
            // For web, render error page
            return Inertia::render('Error', [
                'message' => 'Failed to load companies',
                'error' => $e->getMessage()
            ])->withStatus(500);
        }
    }

    /**
     * Show the form for creating a new company.
     */
    public function create(Request $request)
    {
        try {
            $clientTypes = ClientType::all()->map(function($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'information' => $type->information
                ];
            });
            
            $quotationId = $request->get('quotation_id');
            
            return Inertia::render('Companies/Create', [
                'client_types' => $clientTypes,
                'quotation_id' => $quotationId
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in create company form: ' . $e->getMessage());
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load create form'
                ], 500);
            }
            
            return back()->with('error', 'Failed to load form');
        }
    }

/**
 * Store a newly created company.
 */
public function store(Request $request)
{
    DB::beginTransaction();
    try {
        \Log::info('=== STORE COMPANY REQUEST ===');
        \Log::info('Request data:', $request->except(['logo'])); // Exclude file from log
        \Log::info('Has logo file:', ['has_logo' => $request->hasFile('logo')]);
        
        // **VALIDASI - PERBAIKI POSTAL CODE DAN VAT NUMBER**
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'client_type_id' => 'required|exists:client_type,id',
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:20',
            'contact_position' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20', // Ubah dari integer ke string
            'vat_number' => 'nullable|string|max:50', // Ubah dari integer ke string
            'nib' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status' => 'required|in:active,inactive',
            'quotation_id' => 'nullable|exists:quotations,id',
            'lead_id' => 'nullable|exists:leads,id'
        ], [
            'client_type_id.exists' => 'Tipe klien tidak valid.',
            'quotation_id.exists' => 'Quotation tidak ditemukan.',
            'lead_id.exists' => 'Lead tidak ditemukan.',
            'contact_person.required' => 'Nama kontak wajib diisi.',
            'contact_email.required' => 'Email kontak wajib diisi.',
            'contact_phone.required' => 'Telepon kontak wajib diisi.'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // **CEK QUOTATION JIKA ADA**
        $quotationData = null;
        $leadId = $request->lead_id;
        
        if ($request->quotation_id) {
            $quotation = Quotation::with(['lead'])
                ->where('id', $request->quotation_id)
                ->where('deleted', 0)
                ->first();

            if (!$quotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation tidak ditemukan'
                ], 404);
            }

            // Check if already has active company
            $existingCompany = Company::where('quotation_id', $request->quotation_id)
                ->where('deleted', 0)
                ->first();
                
            if ($existingCompany) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perusahaan sudah dibuat dari quotation ini'
                ], 400);
            }

            $quotationData = $quotation;
            $leadId = $quotation->lead_id;
            
            \Log::info('Membuat perusahaan dari quotation:', [
                'quotation_id' => $quotation->id,
                'lead_id' => $leadId
            ]);
        }

        // **HANDLE LOGO UPLOAD**
        $logoPath = null;
        if ($request->hasFile('logo')) {
            \Log::info('Processing logo upload...');
            try {
                $file = $request->file('logo');
                \Log::info('File details:', [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType()
                ]);
                
                // Simpan file
                $logoPath = $file->store('companies/logos', 'public');
                \Log::info('Logo saved to:', ['path' => $logoPath]);
            } catch (\Exception $e) {
                \Log::error('Logo upload failed:', ['error' => $e->getMessage()]);
                // Lanjut tanpa logo jika upload gagal
            }
        }

        // **SIMPAN DATA PERUSAHAAN**
        $companyData = [
            'client_type_id' => $request->client_type_id,
            'lead_id' => $leadId,
            'quotation_id' => $request->quotation_id,
            'client_code' => $request->company_name, // Nama perusahaan
            'city' => $request->city,
            'province' => $request->province,
            'country' => $request->country,
            'postal_code' => $request->postal_code,
            'vat_number' => $request->vat_number,
            'nib' => $request->nib,
            'website' => $request->website,
            'logo_path' => $logoPath,
            'client_since' => now(),
            'is_active' => $request->status === 'active',
            'deleted' => false
        ];

        $company = Company::create($companyData);

        \Log::info('Perusahaan berhasil dibuat:', [
            'id' => $company->id,
            'client_code' => $company->client_code
        ]);

        // **SIMPAN DATA KONTAK KE TABLE company_contact_persons**
        $contactData = [
            'company_id' => $company->id,
            'lead_id' => $leadId,
            'name' => $request->contact_person,
            'email' => $request->contact_email,
            'phone' => $request->contact_phone,
            'position' => $request->contact_position,
            'is_primary' => true,
            'is_active' => true,
            'deleted' => false
        ];

        $contact = CompanyContactPerson::create($contactData);

        \Log::info('Kontak perusahaan berhasil dibuat:', [
            'id' => $contact->id,
            'name' => $contact->name,
            'company_id' => $company->id
        ]);

        // **UPDATE QUOTATION NOTE SAJA**
        if ($request->quotation_id && $quotationData) {
            $quotationData->update([
                'note' => ($quotationData->note ?? '') . "\n\n[Converted to Company: " . $company->client_code . " on " . now()->format('Y-m-d H:i:s') . "]",
                'updated_at' => now()
            ]);
            \Log::info('Quotation updated with conversion note:', ['quotation_id' => $quotationData->id]);
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Klien berhasil dibuat!',
            'data' => [
                'id' => $company->id,
                'client_code' => $company->client_code,
                'company_name' => $company->client_code,
                'logo_url' => $logoPath ? Storage::url($logoPath) : null
            ]
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error creating company: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Gagal membuat klien: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Show company details with all related data.
 */
public function show($id)
{
    try {
        Log::info('=== SHOW COMPANY REQUEST ===');
        Log::info('Company ID: ' . $id);
        Log::info('Request URL: ' . request()->fullUrl());
        
        // Cari company berdasarkan ID (UUID)
        $company = Company::with([
            'clientType',
            'lead',
            'quotation',
            'contacts' => function($query) {
                $query->where('is_active', true)
                      ->where('deleted', 0)
                      ->orderBy('is_primary', 'desc');
            },
            'creator',
            'updater'
        ])->find($id);

        if (!$company) {
            Log::error('Company not found: ' . $id);
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        Log::info('Company found:', [
            'id' => $company->id,
            'client_code' => $company->client_code,
            'quotation_id' => $company->quotation_id,
            'lead_id' => $company->lead_id
        ]);

        // ==================== QUOTATIONS LOGIC ====================
        Log::info('=== START QUOTATIONS FETCHING ===');
        
        $allQuotations = collect();
        
        if ($company->quotation_id) {
            Log::info('Company has quotation_id: ' . $company->quotation_id);
            
            $primaryQuotation = Quotation::with(['lead', 'acceptor'])
                ->where('id', $company->quotation_id)
                ->where('deleted', 0)
                ->first();
            
            if ($primaryQuotation) {
                Log::info('Primary quotation found:', [
                    'id' => $primaryQuotation->id,
                    'quotation_number' => $primaryQuotation->quotation_number,
                    'lead_id' => $primaryQuotation->lead_id
                ]);
                
                $allQuotations->push($primaryQuotation);
                
                if ($primaryQuotation->lead_id) {
                    Log::info('Looking for other quotations with same lead_id: ' . $primaryQuotation->lead_id);
                    
                    $relatedQuotations = Quotation::with(['lead', 'acceptor'])
                        ->where('lead_id', $primaryQuotation->lead_id)
                        ->where('id', '!=', $primaryQuotation->id)
                        ->where('deleted', 0)
                        ->orderBy('created_at', 'desc')
                        ->get();
                    
                    Log::info('Found ' . $relatedQuotations->count() . ' related quotations');
                    $allQuotations = $allQuotations->merge($relatedQuotations);
                }
            }
        } elseif ($company->lead_id) {
            Log::info('Looking for quotations using company lead_id: ' . $company->lead_id);
            
            $quotationsByLead = Quotation::with(['lead', 'acceptor'])
                ->where('lead_id', $company->lead_id)
                ->where('deleted', 0)
                ->orderBy('created_at', 'desc')
                ->get();
            
            Log::info('Found ' . $quotationsByLead->count() . ' quotations by lead_id');
            $allQuotations = $quotationsByLead;
        }
        
        Log::info('Total quotations to display: ' . $allQuotations->count());
        
        // Format quotations
        $formattedQuotations = $allQuotations->map(function($quotation) {
            $formatDate = function($dateValue) {
                if (!$dateValue) return null;
                
                if (is_string($dateValue)) {
                    try {
                        $parsedDate = Carbon::parse($dateValue);
                        return $parsedDate->format('Y-m-d');
                    } catch (\Exception $e) {
                        return $dateValue;
                    }
                }
                
                if ($dateValue instanceof \Carbon\Carbon) {
                    return $dateValue->format('Y-m-d');
                }
                
                if ($dateValue instanceof \DateTime) {
                    return $dateValue->format('Y-m-d');
                }
                
                return null;
            };
            
            return [
                'id' => $quotation->id,
                'quotation_number' => $quotation->quotation_number,
                'date' => $formatDate($quotation->date),
                'valid_until' => $formatDate($quotation->valid_until),
                'status' => $quotation->status,
                'subject' => $quotation->subject,
                'payment_terms' => $quotation->payment_terms,
                'note' => $quotation->note,
                'revision_note' => $quotation->revision_note,
                'subtotal' => (float) $quotation->subtotal,
                'discount' => (float) $quotation->discount,
                'tax' => (float) $quotation->tax,
                'total' => (float) $quotation->total,
                'lead' => $quotation->lead ? [
                    'id' => $quotation->lead->id,
                    'company_name' => $quotation->lead->company_name,
                    'address' => $quotation->lead->address
                ] : null,
                'lead_id' => $quotation->lead_id,
                'accepted_at' => $quotation->accepted_at ? 
                    (is_string($quotation->accepted_at) ? 
                        $quotation->accepted_at : 
                        $quotation->accepted_at->format('Y-m-d H:i:s')) : null,
                'accepted_by' => $quotation->acceptor ? [
                    'id' => $quotation->acceptor->id,
                    'name' => $quotation->acceptor->name
                ] : null,
                'pdf_path' => $quotation->pdf_path ? Storage::url($quotation->pdf_path) : null,
                'created_at' => $quotation->created_at ? 
                    (is_string($quotation->created_at) ? 
                        $quotation->created_at : 
                        $quotation->created_at->format('Y-m-d H:i:s')) : null,
                'updated_at' => $quotation->updated_at ? 
                    (is_string($quotation->updated_at) ? 
                        $quotation->updated_at : 
                        $quotation->updated_at->format('Y-m-d H:i:s')) : null
            ];
        })->values();
        
        Log::info('=== END QUOTATIONS FETCHING ===');
        // ==================== END QUOTATIONS LOGIC ====================

        // ==================== INVOICES LOGIC ====================
        Log::info('=== START INVOICES FETCHING ===');
        
        // Ambil semua invoices yang terkait dengan company ini
        $invoices = $this->getCompanyInvoices($company);
        
        Log::info('Total invoices found: ' . $invoices->count());
        
        // Format invoices untuk response
        $formattedInvoices = $invoices->map(function($invoice) {
            return [
                'id' => $invoice->id,
                'quotation_id' => $invoice->quotation_id,
                'company_contact_persons_id' => $invoice->company_contact_persons_id,
                'invoice_number' => $invoice->invoice_number,
                'date' => $invoice->date ? 
                    (is_string($invoice->date) ? 
                        $invoice->date : 
                        $invoice->date->format('Y-m-d')) : null,
                'invoice_amount' => (float) $invoice->invoice_amout, // Note: typo in column name
                'payment_terms' => $invoice->payment_terms,
                'payment_type' => $invoice->payment_type,
                'payment_percentage' => $invoice->payment_percentage ? (float) $invoice->payment_percentage : null,
                'note' => $invoice->note,
                'ppn' => $invoice->ppn ? (float) $invoice->ppn : null,
                'pph' => $invoice->pph ? (float) $invoice->pph : null,
                'total' => $invoice->total ? (float) $invoice->total : null,
                'amount_due' => (float) $invoice->amount_due,
                'status' => strtolower($invoice->status), // Convert to lowercase for consistency
                'status_display' => $invoice->status, // Original status
                'created_at' => $invoice->created_at ? 
                    (is_string($invoice->created_at) ? 
                        $invoice->created_at : 
                        $invoice->created_at->format('Y-m-d H:i:s')) : null,
                'updated_at' => $invoice->updated_at ? 
                    (is_string($invoice->updated_at) ? 
                        $invoice->updated_at : 
                        $invoice->updated_at->format('Y-m-d H:i:s')) : null,
                // Tambahkan data quotation jika ada
                'quotation' => $invoice->quotation ? [
                    'id' => $invoice->quotation->id,
                    'quotation_number' => $invoice->quotation->quotation_number,
                    'subject' => $invoice->quotation->subject
                ] : null,
                // Tambahkan data contact person
                'contact_person' => $invoice->contactPerson ? [
                    'id' => $invoice->contactPerson->id,
                    'name' => $invoice->contactPerson->name,
                    'email' => $invoice->contactPerson->email,
                    'phone' => $invoice->contactPerson->phone,
                    'position' => $invoice->contactPerson->position
                ] : null
            ];
        })->values();
        
        Log::info('=== END INVOICES FETCHING ===');
        // ==================== END INVOICES LOGIC ====================

        // ==================== PAYMENTS LOGIC ====================
        Log::info('=== START PAYMENTS FETCHING ===');
        
        // Ambil data payments dari database (asumsi tabel payments)
        // Jika belum ada tabel payments, gunakan array kosong
        $payments = $this->getCompanyPayments($company);
        
        Log::info('Total payments found: ' . $payments->count());
        Log::info('=== END PAYMENTS FETCHING ===');
        // ==================== END PAYMENTS LOGIC ====================

        // ==================== PROJECTS LOGIC ====================
        Log::info('=== START PROJECTS FETCHING ===');
        
        // Ambil data projects dari database (asumsi tabel projects)
        $projects = $this->getCompanyProjects($company);
        
        Log::info('Total projects found: ' . $projects->count());
        Log::info('=== END PROJECTS FETCHING ===');
        // ==================== END PROJECTS LOGIC ====================

        // Get primary contact
        $primaryContact = $company->contacts->firstWhere('is_primary', true);
        
        Log::info('Primary contact:', $primaryContact ? [
            'name' => $primaryContact->name,
            'email' => $primaryContact->email
        ] : ['message' => 'No primary contact found']);

        // Data company untuk response
        $companyData = [
            'id' => $company->id,
            'name' => $company->client_code,
            'client_code' => $company->client_code,
            'client_type' => $company->clientType ? [
                'id' => $company->clientType->id,
                'name' => $company->clientType->name
            ] : null,
            'city' => $company->city,
            'province' => $company->province,
            'country' => $company->country,
            'postal_code' => $company->postal_code,
            'vat_number' => $company->vat_number,
            'nib' => $company->nib,
            'website' => $company->website,
            'logo_path' => $company->logo_path,
            'logo_url' => $company->logo_path ? Storage::url($company->logo_path) : null,
            'client_since' => $company->client_since ? 
                (is_string($company->client_since) ? 
                    $company->client_since : 
                    $company->client_since->format('Y-m-d')) : null,
            'is_active' => (bool) $company->is_active,
            'lead' => $company->lead ? [
                'id' => $company->lead->id,
                'company_name' => $company->lead->company_name,
                'address' => $company->lead->address
            ] : null,
            'quotation' => $company->quotation ? [
                'id' => $company->quotation->id,
                'quotation_number' => $company->quotation->quotation_number
            ] : null,
            'quotation_id' => $company->quotation_id,
            'lead_id' => $company->lead_id,
            // Data contact person
            'contact_person' => $primaryContact ? $primaryContact->name : null,
            'contact_email' => $primaryContact ? $primaryContact->email : null,
            'contact_phone' => $primaryContact ? $primaryContact->phone : null,
            'contact_position' => $primaryContact ? $primaryContact->position : null,
            'primary_contact' => $primaryContact ? [
                'name' => $primaryContact->name,
                'email' => $primaryContact->email,
                'phone' => $primaryContact->phone,
                'position' => $primaryContact->position
            ] : null,
            'contacts' => $company->contacts->map(function($contact) {
                return [
                    'id' => $contact->id,
                    'name' => $contact->name,
                    'email' => $contact->email,
                    'phone' => $contact->phone,
                    'position' => $contact->position,
                    'is_primary' => (bool) $contact->is_primary,
                    'is_active' => (bool) $contact->is_active,
                    'created_at' => $contact->created_at ? 
                        (is_string($contact->created_at) ? 
                            $contact->created_at : 
                            $contact->created_at->format('Y-m-d H:i:s')) : null,
                    'updated_at' => $contact->updated_at ? 
                        (is_string($contact->updated_at) ? 
                            $contact->updated_at : 
                            $contact->updated_at->format('Y-m-d H:i:s')) : null
                ];
            }),
            'created_at' => $company->created_at ? 
                (is_string($company->created_at) ? 
                    $company->created_at : 
                    $company->created_at->format('Y-m-d H:i:s')) : null,
            'updated_at' => $company->updated_at ? 
                (is_string($company->updated_at) ? 
                    $company->updated_at : 
                    $company->updated_at->format('Y-m-d H:i:s')) : null
        ];

        Log::info('Company data prepared successfully');
        Log::info('Quotations count: ' . $formattedQuotations->count());
        Log::info('Invoices count: ' . $formattedInvoices->count());

        // ==================== STATISTICS ====================
        $statistics = [
            // Quotation statistics
            'total_quotations' => $formattedQuotations->count(),
            'accepted_quotations' => $formattedQuotations->where('status', 'accepted')->count(),
            'expired_quotations' => $formattedQuotations->where('status', 'expired')->count(),
            'cancelled_quotations' => $formattedQuotations->where('status', 'rejected')->count(),
            'draft_quotations' => $formattedQuotations->where('status', 'draft')->count(),
            'sent_quotations' => $formattedQuotations->where('status', 'sent')->count(),
            
            // Invoice statistics
            'total_invoices' => $formattedInvoices->count(),
            'paid_invoices' => $formattedInvoices->where('status', 'paid')->count(),
            'unpaid_invoices' => $formattedInvoices->where('status', 'unpaid')->count(),
            'draft_invoices' => $formattedInvoices->where('status', 'draft')->count(),
            'cancelled_invoices' => $formattedInvoices->where('status', 'cancelled')->count(),
            'total_invoice_amount' => $formattedInvoices->sum('invoice_amount'),
            'total_amount_due' => $formattedInvoices->sum('amount_due'),
            
            // Payment statistics
            'total_payments' => $payments->count(),
            'total_payment_amount' => $payments->sum('amount'),
            
            // Project statistics
            'total_projects' => $projects->count(),
            'active_projects' => $projects->where('status', 'in_progress')->count(),
            'completed_projects' => $projects->where('status', 'completed')->count(),
            
            // Contact statistics
            'active_contacts' => count($companyData['contacts']),
            
            // Additional analytics
            'unique_leads' => $formattedQuotations->pluck('lead_id')->unique()->count(),
            'total_quotation_value' => $formattedQuotations->sum('total'),
            'average_quotation_value' => $formattedQuotations->count() > 0 
                ? $formattedQuotations->sum('total') / $formattedQuotations->count() 
                : 0,
        ];

        // Group quotations by lead
        $groupedQuotations = $this->groupQuotationsByLead($formattedQuotations);

        Log::info('Rendering Inertia page...');

        return Inertia::render('Companies/Show', [
            'company' => $companyData,
            'quotations' => $formattedQuotations,
            'grouped_quotations' => $groupedQuotations,
            'invoices' => $formattedInvoices,
            'payments' => $payments,
            'projects' => $projects,
            'contacts' => $companyData['contacts'],
            'statistics' => $statistics
        ]);

    } catch (\Exception $e) {
        Log::error('Error in company show: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

/**
 * Get invoices related to company through contact persons
 */
private function getCompanyInvoices($company)
{
    // Strategy 1: Cari invoices melalui company_contact_persons yang memiliki company_id sama
    $contactPersonIds = DB::table('company_contact_persons')
        ->where('company_id', $company->id)
        ->where('deleted', 0)
        ->pluck('id');
    
    Log::info('Contact person IDs found: ' . $contactPersonIds->count());
    
    // Jika tidak ada contact persons melalui company_id, coba melalui lead_id
    if ($contactPersonIds->isEmpty() && $company->lead_id) {
        $contactPersonIds = DB::table('company_contact_persons')
            ->where('lead_id', $company->lead_id)
            ->where('deleted', 0)
            ->pluck('id');
        
        Log::info('Contact person IDs found via lead_id: ' . $contactPersonIds->count());
    }
    
    if ($contactPersonIds->isEmpty()) {
        Log::info('No contact person IDs found for company/lead');
        return collect();
    }
    
    // Ambil invoices yang terkait dengan contact person IDs
    $invoices = Invoice::with([
        'quotation:id,quotation_number,subject',
        'contactPerson:id,name,email,phone,position'
    ])
    ->whereIn('company_contact_persons_id', $contactPersonIds)
    ->where('deleted', 0)
    ->orderBy('date', 'desc')
    ->orderBy('invoice_number', 'desc')
    ->get();
    
    Log::info('Invoices fetched: ' . $invoices->count());
    
    return $invoices;
}

/**
 * Get payments related to company
 * Asumsi: Tabel payments memiliki company_id atau invoice_id
 */
private function getCompanyPayments($company)
{
    try {
        Log::info('Fetching payments for company ID: ' . $company->id);
        
        // Strategy 1: Cari payments melalui invoices yang terkait dengan company
        // 1. Cari contact person IDs terkait company
        $contactPersonIds = DB::table('company_contact_persons')
            ->where('company_id', $company->id)
            ->where('deleted', 0)
            ->pluck('id');
        
        Log::info('Contact person IDs found via company_id: ' . $contactPersonIds->count());
        
        // 2. Jika tidak ada, coba melalui lead_id
        if ($contactPersonIds->isEmpty() && $company->lead_id) {
            $contactPersonIds = DB::table('company_contact_persons')
                ->where('lead_id', $company->lead_id)
                ->where('deleted', 0)
                ->pluck('id');
            
            Log::info('Contact person IDs found via lead_id: ' . $contactPersonIds->count());
        }
        
        if ($contactPersonIds->isEmpty()) {
            Log::info('No contact person IDs found for company/lead');
            return collect();
        }
        
        // 3. Cari invoice IDs yang terkait dengan contact persons
        $invoiceIds = DB::table('invoices')
            ->whereIn('company_contact_persons_id', $contactPersonIds)
            ->where('deleted', 0)
            ->pluck('id');
        
        Log::info('Invoice IDs found: ' . $invoiceIds->count());
        
        if ($invoiceIds->isEmpty()) {
            Log::info('No invoices found for contact persons');
            return collect();
        }
        
        // 4. Ambil payments yang terkait dengan invoice IDs
        $payments = Payment::with([
            'invoice' => function($query) {
                $query->select('id', 'invoice_number', 'invoice_amout', 'date');
            },
            'creator' => function($query) {
                $query->select('id', 'name', 'email');
            },
            'updater' => function($query) {
                $query->select('id', 'name', 'email');
            }
        ])
        ->whereIn('invoice_id', $invoiceIds)
        ->where('deleted', 0)
        ->orderBy('date', 'desc')
        ->orderBy('created_at', 'desc')
        ->get();
        
        Log::info('Payments fetched: ' . $payments->count());
        
        // 5. Format data payments
        $formattedPayments = $payments->map(function($payment) {
            $methodMapping = [
                'transfer' => 'bank_transfer',
                'cash' => 'cash',
                'check' => 'check'
            ];
            
            return [
                'id' => $payment->id,
                'invoice_id' => $payment->invoice_id,
                'invoice_number' => $payment->invoice ? $payment->invoice->invoice_number : 'N/A',
                'invoice_amount' => $payment->invoice ? (float) $payment->invoice->invoice_amout : 0,
                'invoice_date' => $payment->invoice && $payment->invoice->date ? 
                    (is_string($payment->invoice->date) ? 
                        $payment->invoice->date : 
                        $payment->invoice->date->format('Y-m-d')) : null,
                'amount' => (float) $payment->amount,
                'method' => isset($methodMapping[$payment->method]) ? 
                    $methodMapping[$payment->method] : $payment->method,
                'method_display' => $payment->method,
                'date' => $payment->date ? 
                    (is_string($payment->date) ? 
                        $payment->date : 
                        $payment->date->format('Y-m-d')) : null,
                'note' => $payment->note,
                'bank' => $payment->bank,
                'created_by' => $payment->creator ? [
                    'id' => $payment->creator->id,
                    'name' => $payment->creator->name,
                    'email' => $payment->creator->email
                ] : null,
                'updated_by' => $payment->updater ? [
                    'id' => $payment->updater->id,
                    'name' => $payment->updater->name,
                    'email' => $payment->updater->email
                ] : null,
                'created_at' => $payment->created_at ? 
                    (is_string($payment->created_at) ? 
                        $payment->created_at : 
                        $payment->created_at->format('Y-m-d H:i:s')) : null,
                'updated_at' => $payment->updated_at ? 
                    (is_string($payment->updated_at) ? 
                        $payment->updated_at : 
                        $payment->updated_at->format('Y-m-d H:i:s')) : null
            ];
        });
        
        return $formattedPayments;
        
    } catch (\Exception $e) {
        Log::error('Error fetching payments: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return collect();
    }
}

/**
 * Get projects related to company
 */
private function getCompanyProjects($company)
{
    // Cek apakah model Project ada
    if (class_exists('App\Models\Project')) {
        try {
            // Asumsi: Tabel projects memiliki company_id
            return Project::where('company_id', $company->id)
                ->where('deleted', 0)
                ->orderBy('start_date', 'desc')
                ->get()
                ->map(function($project) {
                    return [
                        'id' => $project->id,
                        'project_description' => $project->description,
                        'start_date' => $project->start_date ? $project->start_date->format('Y-m-d') : null,
                        'deadline' => $project->deadline ? $project->deadline->format('Y-m-d') : null,
                        'status' => $project->status,
                        'company_id' => $project->company_id,
                        'created_at' => $project->created_at ? $project->created_at->format('Y-m-d H:i:s') : null,
                        'updated_at' => $project->updated_at ? $project->updated_at->format('Y-m-d H:i:s') : null
                    ];
                });
                
        } catch (\Exception $e) {
            Log::warning('Error fetching projects: ' . $e->getMessage());
            return collect();
        }
    }
    
    // Fallback: Return empty collection
    return collect();
}

    /**
     * Helper method untuk grouping quotations by lead
     */
    private function groupQuotationsByLead($quotations)
    {
        $grouped = [];
        
        foreach ($quotations as $quotation) {
            $leadId = $quotation['lead_id'] ?? 'no_lead';
            $leadName = $quotation['lead']['company_name'] ?? 'Unknown Lead';
            
            if (!isset($grouped[$leadId])) {
                $grouped[$leadId] = [
                    'lead_id' => $leadId,
                    'lead_name' => $leadName,
                    'lead' => $quotation['lead'] ?? null,
                    'quotations' => [],
                    'count' => 0,
                    'latest_status' => $quotation['status'],
                    'total_value' => 0,
                    'first_date' => $quotation['date'],
                    'last_date' => $quotation['date']
                ];
            }
            
            $grouped[$leadId]['quotations'][] = $quotation;
            $grouped[$leadId]['count']++;
            $grouped[$leadId]['total_value'] += $quotation['total'];
            
            // Update status terbaru
            $latestDate = strtotime($quotation['date']);
            $currentLatest = strtotime($grouped[$leadId]['last_date']);
            
            if ($latestDate > $currentLatest) {
                $grouped[$leadId]['latest_status'] = $quotation['status'];
                $grouped[$leadId]['last_date'] = $quotation['date'];
            }
            
            // Update tanggal pertama
            $firstDate = strtotime($quotation['date']);
            $currentFirst = strtotime($grouped[$leadId]['first_date']);
            
            if ($firstDate < $currentFirst) {
                $grouped[$leadId]['first_date'] = $quotation['date'];
            }
        }
        
        // Convert to array values
        $result = array_values($grouped);
        
        Log::info('Grouped quotations into ' . count($result) . ' lead groups');
        
        return $result;
    }

   /**
     * Get company quotations (API endpoint)
     */
    public function getCompanyQuotations(Company $company)
    {
        try {
            $quotations = Quotation::where('company_id', $company->id)
                ->where('deleted', 0)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($quotation) {
                    return [
                        'id' => $quotation->id,
                        'quotation_number' => $quotation->quotation_number,
                        'date' => $quotation->created_at->format('Y-m-d'),
                        'subject' => $quotation->subject,
                        'total' => (float) $quotation->total,
                        'status' => $quotation->status,
                        'company_id' => $quotation->company_id
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $quotations,
                'count' => $quotations->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching company quotations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data quotations'
            ], 500);
        }
    }

    /**
     * Get company statistics (API endpoint)
     */
    public function getCompanyStatistics(Company $company)
    {
        try {
            $statistics = [
                'total_quotations' => Quotation::where('company_id', $company->id)->where('deleted', 0)->count(),
                'accepted_quotations' => Quotation::where('company_id', $company->id)->where('status', 'accepted')->where('deleted', 0)->count(),
                'expired_quotations' => Quotation::where('company_id', $company->id)->where('status', 'expired')->where('deleted', 0)->count(),
                'cancelled_quotations' => Quotation::where('company_id', $company->id)->where('status', 'cancelled')->where('deleted', 0)->count(),
                'total_invoices' => Invoice::where('company_id', $company->id)->where('deleted', 0)->count(),
                'paid_invoices' => Invoice::where('company_id', $company->id)->where('status', 'paid')->where('deleted', 0)->count(),
                'pending_invoices' => Invoice::where('company_id', $company->id)->where('status', 'pending')->where('deleted', 0)->count(),
                'overdue_invoices' => Invoice::where('company_id', $company->id)->where('status', 'overdue')->where('deleted', 0)->count(),
                'total_payments' => Payment::where('company_id', $company->id)->where('deleted', 0)->count(),
                'total_projects' => Project::where('company_id', $company->id)->where('deleted', 0)->count(),
                'active_contacts' => CompanyContactPerson::where('company_id', $company->id)->where('is_active', true)->where('deleted', 0)->count(),
                'total_contracts' => 0, // Add if you have contracts table
                'total_documents' => 0, // Add if you have documents table
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching company statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik perusahaan'
            ], 500);
        }
    }

/**
 * Get accepted quotations for company creation - SIMPLE FIX
 */
public function getAcceptedQuotations(Request $request)
{
    try {
        // Cek semua kemungkinan status
        $quotations = Quotation::with(['lead'])
            ->where(function($query) {
                // Coba semua kemungkinan penulisan "accepted"
                $query->where('status', 'accepted')
                      ->orWhere('status', 'Accepted')
                      ->orWhere('status', 'ACCEPTED')
                      ->orWhere('status', 'Accepté') // Jika ada special character
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%accept%']);
            })
            ->where('deleted', 0)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function($quotation) {
                return [
                    'id' => $quotation->id,
                    'quotation_number' => $quotation->quotation_number,
                    'date' => $quotation->date ? $quotation->date->format('Y-m-d') : null,
                    'subject' => $quotation->subject,
                    'total' => (float) $quotation->total,
                    'status' => $quotation->status,
                    'lead' => $quotation->lead ? [
                        'id' => $quotation->lead->id,
                        'company_name' => $quotation->lead->company_name,
                        'contact_person' => $quotation->lead->contact_person,
                        'email' => $quotation->lead->email,
                        'phone' => $quotation->lead->phone
                    ] : null
                ];
            });
        
        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diambil',
            'data' => $quotations,
            'total' => $quotations->count()
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data',
            'data' => []
        ], 500);
    }
}

// app/Http/Controllers/CompanyController.php

/**
 * Get lead data from quotation for company creation
 */
public function getLeadFromQuotation($quotationId)
{
    try {
        Log::info('Fetching lead from quotation ID: ' . $quotationId);
        
        // Ambil quotation dengan lead data
        $quotation = Quotation::with(['lead'])
            ->where('id', $quotationId)
            ->where('deleted', 0)
            ->first();
        
        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation not found'
            ], 404);
        }
        
        // Cek apakah quotation sudah accepted
        if ($quotation->status !== 'accepted') {
            return response()->json([
                'success' => false,
                'message' => 'Quotation is not accepted'
            ], 400);
        }
        
        // Cek apakah quotation sudah memiliki company
        if ($quotation->company) {
            return response()->json([
                'success' => false,
                'message' => 'This quotation already has a company'
            ], 400);
        }
        
        $lead = $quotation->lead;
        
        if (!$lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found for this quotation'
            ], 404);
        }
        
        // Format lead data
        $leadData = [
            'id' => $lead->id,
            'company_name' => $lead->company_name,
            'contact_person' => $lead->contact_person,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'address' => $lead->address,
            'city' => $lead->city,
            'province' => $lead->province,
            'country' => $lead->country,
            'postal_code' => $lead->postal_code,
            'website' => $lead->website,
            'industry' => $lead->industry,
            'source' => $lead->source,
            'status' => $lead->status,
            'created_at' => $lead->created_at ? $lead->created_at->format('Y-m-d H:i:s') : null
        ];
        
        Log::info('Lead data found for quotation ' . $quotationId);
        
        return response()->json([
            'success' => true,
            'message' => 'Lead data retrieved successfully',
            'data' => $leadData
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error fetching lead from quotation: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch lead data',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Update company.
 */
public function update(Request $request, $id)
{
    DB::beginTransaction();
    try {
        \Log::info('=== UPDATE COMPANY REQUEST ===');
        \Log::info('Company ID: ' . $id);
        \Log::info('Request data:', $request->except(['logo'])); // Exclude file from log
        
        $company = Company::findOrFail($id);

        // **VALIDASI DATA**
        $validator = Validator::make($request->all(), [
            // Company fields
            'company_name' => 'required|string|max:255',
            'client_type_id' => 'required|exists:client_type,id',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'nib' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status' => 'required|in:active,inactive',
            'delete_logo' => 'nullable|boolean',
            
            // **BARU**: Contact person fields
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:20',
            'contact_position' => 'nullable|string|max:100',
        ], [
            'client_type_id.exists' => 'Tipe klien tidak valid.',
            'postal_code.integer' => 'Kode pos harus berupa angka.',
            'vat_number.integer' => 'VAT number harus berupa angka.',
            'website.url' => 'Format website tidak valid.',
            'contact_person.required' => 'Nama kontak wajib diisi.',
            'contact_email.required' => 'Email kontak wajib diisi.',
            'contact_phone.required' => 'Telepon kontak wajib diisi.'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed: ' . json_encode($validator->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle logo upload
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            \Log::info('Uploading new logo');
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }
            $logoPath = $request->file('logo')->store('companies/logos', 'public');
            $company->logo_path = $logoPath;
            \Log::info('Logo uploaded to: ' . $logoPath);
        }

        // Handle logo deletion
        if ($request->has('delete_logo') && $request->delete_logo == '1') {
            \Log::info('Deleting logo');
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
                $company->logo_path = null;
                \Log::info('Logo deleted');
            }
        }

        // Update company data
        $updateData = [
            'client_type_id' => $request->client_type_id,
            'client_code' => $request->company_name,
            'city' => $request->city,
            'province' => $request->province,
            'country' => $request->country,
            'postal_code' => $request->postal_code,
            'vat_number' => $request->vat_number,
            'nib' => $request->nib,
            'website' => $request->website,
            'is_active' => $request->status === 'active',
            'updated_by' => auth()->check() ? auth()->id() : null,
            'updated_at' => now()
        ];

        \Log::info('Updating company with data: ', $updateData);
        $company->update($updateData);

        // **UPDATE ATAU BUAT KONTAK UTAMA**
        $primaryContact = CompanyContactPerson::where('company_id', $company->id)
            ->where('is_primary', true)
            ->where('deleted', 0)
            ->first();

        if ($primaryContact) {
            // Update existing primary contact
            $primaryContact->update([
                'name' => $request->contact_person,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'position' => $request->contact_position,
                'updated_at' => now()
            ]);
            \Log::info('Primary contact updated: ' . $primaryContact->id);
        } else {
            // Create new primary contact
            $contactData = [
                'company_id' => $company->id,
                'lead_id' => $company->lead_id,
                'name' => $request->contact_person,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'position' => $request->contact_position,
                'is_primary' => true,
                'is_active' => true,
                'deleted' => false
            ];
            $primaryContact = CompanyContactPerson::create($contactData);
            \Log::info('Primary contact created: ' . $primaryContact->id);
        }

        \Log::info('Company updated successfully: ', [
            'id' => $company->id,
            'client_code' => $company->client_code
        ]);

        DB::commit();

        // Load fresh data with relationships
        $company->load(['clientType', 'primaryContact']);

        return response()->json([
            'success' => true,
            'message' => 'Klien dan kontak berhasil diperbarui!',
            'data' => [
                'id' => $company->id,
                'client_code' => $company->client_code,
                'name' => $company->client_code,
                'contact_person' => $primaryContact->name,
                'contact_email' => $primaryContact->email,
                'contact_phone' => $primaryContact->phone,
                'contact_position' => $primaryContact->position
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error updating company ' . $id . ': ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Gagal memperbarui klien: ' . $e->getMessage()
        ], 500);
    }
}

    /**
 * Get primary contact for company (API endpoint)
 */
public function getPrimaryContact($companyId)
{
    try {
        \Log::info('Fetching primary contact for company: ' . $companyId);
        
        // Cari company
        $company = Company::find($companyId);
        
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }
        
        // Cari primary contact
        $primaryContact = CompanyContactPerson::where('company_id', $companyId)
            ->where('is_primary', true)
            ->where('is_active', true)
            ->where('deleted', 0)
            ->first();
        
        if (!$primaryContact) {
            // Coba cari contact apa saja
            $anyContact = CompanyContactPerson::where('company_id', $companyId)
                ->where('is_active', true)
                ->where('deleted', 0)
                ->first();
                
            if ($anyContact) {
                return response()->json([
                    'success' => true,
                    'message' => 'Contact found (not primary)',
                    'data' => [
                        'id' => $anyContact->id,
                        'name' => $anyContact->name,
                        'email' => $anyContact->email,
                        'phone' => $anyContact->phone,
                        'position' => $anyContact->position,
                        'is_primary' => (bool) $anyContact->is_primary
                    ]
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'No contact found for this company'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Primary contact found',
            'data' => [
                'id' => $primaryContact->id,
                'name' => $primaryContact->name,
                'email' => $primaryContact->email,
                'phone' => $primaryContact->phone,
                'position' => $primaryContact->position,
                'is_primary' => true
            ]
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error fetching primary contact: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Remove the specified company (soft delete).
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            \Log::info('=== DELETE COMPANY REQUEST ===');
            \Log::info('Company ID: ' . $id);
            
            $company = Company::findOrFail($id);
            
            // Check if already deleted
            if ($company->deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Klien sudah dihapus'
                ], 400);
            }
            
            // Soft delete company
            $company->update([
                'deleted' => true,
                'deleted_at' => now(),
                'deleted_by' => auth()->check() ? auth()->id() : null
            ]);

            // Soft delete associated contacts
            CompanyContactPerson::where('company_id', $id)
                ->where('deleted', 0)
                ->update([
                    'deleted' => true,
                    'deleted_at' => now(),
                    'deleted_by' => auth()->check() ? auth()->id() : null
                ]);

            \Log::info('Company and contacts soft deleted: ' . $company->id);

            DB::commit();

            $message = 'Klien berhasil dipindahkan ke tong sampah.';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'id' => $company->id,
                    'client_code' => $company->client_code,
                    'deleted_at' => $company->deleted_at
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting company ' . $id . ': ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus klien: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Force delete (permanent deletion).
     */
    public function forceDestroy($id)
    {
        DB::beginTransaction();
        try {
            \Log::info('=== FORCE DELETE COMPANY REQUEST ===');
            \Log::info('Company ID: ' . $id);
            
            $company = Company::withTrashed()->find($id);
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perusahaan tidak ditemukan'
                ], 404);
            }
            
            // Delete logo file if exists
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }
            
            // Delete associated contacts
            CompanyContactPerson::where('company_id', $id)->forceDelete();
            
            // Force delete company
            $companyId = $company->id;
            $companyCode = $company->client_code;
            $company->forceDelete();

            \Log::info('Company and contacts permanently deleted: ' . $companyId);

            DB::commit();

            $message = 'Klien berhasil dihapus secara permanen.';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'id' => $companyId,
                    'client_code' => $companyCode,
                    'permanently_deleted' => true
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error force deleting company ' . $id . ': ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus klien secara permanen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete companies.
     */
    public function bulkDestroy(Request $request)
    {
        DB::beginTransaction();
        try {
            \Log::info('=== BULK DELETE REQUEST ===');
            \Log::info('Company IDs: ' . json_encode($request->ids));
            \Log::info('Permanent: ' . ($request->permanent ? 'true' : 'false'));
            
            $ids = $request->ids;
            
            if (empty($ids) || !is_array($ids)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada klien yang dipilih untuk dihapus'
                ], 400);
            }
            
            $deletedCount = 0;
            $errors = [];
            
            foreach ($ids as $id) {
                try {
                    if ($request->permanent) {
                        // Permanent delete
                        $company = Company::withTrashed()->find($id);
                        if ($company) {
                            if ($company->logo_path) {
                                Storage::disk('public')->delete($company->logo_path);
                            }
                            CompanyContactPerson::where('company_id', $id)->forceDelete();
                            $company->forceDelete();
                            $deletedCount++;
                        }
                    } else {
                        // Soft delete
                        $company = Company::find($id);
                        if ($company && !$company->deleted) {
                            $company->update([
                                'deleted' => true,
                                'deleted_at' => now(),
                                'deleted_by' => auth()->check() ? auth()->id() : null
                            ]);
                            CompanyContactPerson::where('company_id', $id)
                                ->where('deleted', 0)
                                ->update([
                                    'deleted' => true,
                                    'deleted_at' => now(),
                                    'deleted_by' => auth()->check() ? auth()->id() : null
                                ]);
                            $deletedCount++;
                        }
                    }
                } catch (\Exception $e) {
                    $errors[] = "ID {$id}: " . $e->getMessage();
                    \Log::error("Error deleting company {$id}: " . $e->getMessage());
                }
            }
            
            DB::commit();

            $message = $deletedCount . ' klien' . ($deletedCount !== 1 ? '' : '') . 
                      ' ' . ($request->permanent ? 'berhasil dihapus permanen' : 'berhasil dipindahkan ke tong sampah') . '.';
        
            if (!empty($errors)) {
                $message .= ' Beberapa error terjadi: ' . implode('; ', $errors);
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'deleted_count' => $deletedCount,
                    'permanent' => $request->permanent,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error in bulk delete: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus klien: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore soft deleted company.
     */
    public function restore($id)
    {
        try {
            $company = Company::withTrashed()->find($id);
            
            if (!$company) {
                throw new \Exception('Perusahaan tidak ditemukan');
            }
            
            $company->update([
                'deleted' => false,
                'deleted_at' => null,
                'deleted_by' => null
            ]);

            // Restore associated contacts
            CompanyContactPerson::where('company_id', $id)
                ->where('deleted', 1)
                ->update([
                    'deleted' => false,
                    'deleted_at' => null,
                    'deleted_by' => null
                ]);

            $message = 'Klien berhasil dipulihkan.';
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => $company->fresh(['clientType', 'primaryContact'])
                ]);
            }

            return redirect()->route('companies.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Error restoring company ' . $id . ': ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal memulihkan klien: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Gagal memulihkan klien: ' . $e->getMessage());
        }
    }

}