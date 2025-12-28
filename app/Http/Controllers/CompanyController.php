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
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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
            \Log::info('Request data:', $request->all());
            
            // **VALIDASI UNTUK SEMUA FIELD**
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
                'postal_code' => 'nullable|integer',
                'vat_number' => 'nullable|integer',
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
                'postal_code.integer' => 'Kode pos harus berupa angka.',
                'vat_number.integer' => 'VAT number harus berupa angka.',
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
                    ->where('status', 'accepted')
                    ->where('deleted', 0)
                    ->first();

                if (!$quotation) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Quotation tidak ditemukan atau belum diterima'
                    ], 404);
                }

                // Check if already has company
                if ($quotation->company) {
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

            // Handle logo upload
            $logoPath = null;
            if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
                $logoPath = $request->file('logo')->store('companies/logos', 'public');
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

            // Load relationships untuk response
            $company->load(['clientType', 'lead', 'quotation', 'primaryContact']);

            return response()->json([
                'success' => true,
                'message' => 'Klien berhasil dibuat!',
                'data' => [
                    'id' => $company->id,
                    'client_code' => $company->client_code,
                    'name' => $company->client_code,
                    'city' => $company->city,
                    'province' => $company->province,
                    'country' => $company->country,
                    'client_type' => $company->clientType ? $company->clientType->name : null,
                    'primary_contact' => $company->primaryContact ? [
                        'id' => $company->primaryContact->id,
                        'name' => $company->primaryContact->name,
                        'email' => $company->primaryContact->email,
                        'phone' => $company->primaryContact->phone,
                        'position' => $company->primaryContact->position
                    ] : null,
                    'lead' => $company->lead ? [
                        'id' => $company->lead->id,
                        'company_name' => $company->lead->company_name,
                        'contact_person' => $company->lead->contact_person,
                        'email' => $company->lead->email,
                        'phone' => $company->lead->phone,
                        'address' => $company->lead->address
                    ] : null,
                    'quotation' => $company->quotation ? [
                        'id' => $company->quotation->id,
                        'quotation_number' => $company->quotation->quotation_number
                    ] : null
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
/**
 * Show company details with all related data.
 */
public function show($id)
{
    try {
        \Log::info('=== SHOW COMPANY REQUEST ===');
        \Log::info('Company ID: ' . $id);
        \Log::info('Request URL: ' . request()->fullUrl());
        
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
            \Log::error('Company not found: ' . $id);
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        \Log::info('Company found:', [
            'id' => $company->id,
            'client_code' => $company->client_code,
            'name' => $company->client_code
        ]);

        // Get primary contact
        $primaryContact = $company->contacts->firstWhere('is_primary', true);
        
        \Log::info('Primary contact:', $primaryContact ? [
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
            'client_since' => $company->client_since ? $company->client_since->format('Y-m-d') : null,
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
                    'created_at' => $contact->created_at,
                    'updated_at' => $contact->updated_at
                ];
            }),
            'created_at' => $company->created_at ? $company->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $company->updated_at ? $company->updated_at->format('Y-m-d H:i:s') : null
        ];

        \Log::info('Company data prepared successfully');
        \Log::info('Data structure:', array_keys($companyData));

        // Data dummy untuk testing
        $quotations = [
            [
                'id' => 1,
                'quotation_number' => 'QUO-2024-001',
                'date' => '2024-01-15',
                'subject' => 'Website Development Project',
                'total' => 75000000,
                'status' => 'approved',
                'company_id' => $company->id
            ]
        ];

        $invoices = [
            [
                'id' => 1,
                'invoice_number' => 'INV-2024-001',
                'date' => '2024-01-25',
                'invoice_amount' => 75000000,
                'ppn' => 7500000,
                'pph' => 1500000,
                'amount_due' => 81000000,
                'status' => 'paid',
                'company_id' => $company->id
            ]
        ];

        $payments = [
            [
                'id' => 1,
                'invoice_id' => 1,
                'invoice_number' => 'INV-2024-001',
                'amount' => 81000000,
                'method' => 'bank_transfer',
                'date' => '2024-01-28',
                'bank' => 'BCA',
                'note' => 'Lunas',
                'company_id' => $company->id
            ]
        ];

        $projects = [
            [
                'id' => 1,
                'project_description' => 'E-commerce Website Development',
                'start_date' => '2024-01-01',
                'deadline' => '2024-03-31',
                'status' => 'in_progress',
                'company_id' => $company->id
            ]
        ];

        $statistics = [
            'total_quotations' => 1,
            'accepted_quotations' => 1,
            'expired_quotations' => 0,
            'cancelled_quotations' => 0,
            'total_invoices' => 1,
            'paid_invoices' => 1,
            'pending_invoices' => 0,
            'overdue_invoices' => 0,
            'total_payments' => 1,
            'total_projects' => 1,
            'active_contacts' => count($companyData['contacts']),
        ];

        \Log::info('Rendering Inertia page...');

        return Inertia::render('Companies/Show', [
            'company' => $companyData,
            'quotations' => $quotations,
            'invoices' => $invoices,
            'payments' => $payments,
            'projects' => $projects,
            'contacts' => $companyData['contacts'],
            'statistics' => $statistics
        ]);

    } catch (\Exception $e) {
        \Log::error('Error in company show: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
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
     * Get company invoices (API endpoint)
     */
    public function getCompanyInvoices(Company $company)
    {
        try {
            $invoices = Invoice::where('company_id', $company->id)
                ->where('deleted', 0)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($invoice) {
                    return [
                        'id' => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'date' => $invoice->invoice_date ? $invoice->invoice_date->format('Y-m-d') : null,
                        'invoice_amount' => (float) $invoice->total_amount,
                        'ppn' => (float) $invoice->tax_amount,
                        'pph' => (float) $invoice->pph_amount,
                        'amount_due' => (float) $invoice->total_amount_due,
                        'status' => $invoice->status,
                        'company_id' => $invoice->company_id
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'count' => $invoices->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching company invoices: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data invoices'
            ], 500);
        }
    }

    /**
     * Get company payments (API endpoint)
     */
    public function getCompanyPayments(Company $company)
    {
        try {
            $payments = Payment::with(['invoice'])
                ->where('company_id', $company->id)
                ->where('deleted', 0)
                ->orderBy('payment_date', 'desc')
                ->get()
                ->map(function($payment) {
                    return [
                        'id' => $payment->id,
                        'invoice_id' => $payment->invoice_id,
                        'invoice_number' => $payment->invoice?->invoice_number,
                        'amount' => (float) $payment->amount,
                        'method' => $payment->payment_method,
                        'date' => $payment->payment_date ? $payment->payment_date->format('Y-m-d') : null,
                        'bank' => $payment->bank_name,
                        'note' => $payment->notes,
                        'company_id' => $payment->company_id
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $payments,
                'count' => $payments->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching company payments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data payments'
            ], 500);
        }
    }

    /**
     * Get company projects (API endpoint)
     */
    public function getCompanyProjects(Company $company)
    {
        try {
            $projects = Project::where('company_id', $company->id)
                ->where('deleted', 0)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($project) {
                    return [
                        'id' => $project->id,
                        'project_description' => $project->project_name,
                        'start_date' => $project->start_date ? $project->start_date->format('Y-m-d') : null,
                        'deadline' => $project->deadline ? $project->deadline->format('Y-m-d') : null,
                        'status' => $project->status,
                        'company_id' => $project->company_id
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $projects,
                'count' => $projects->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching company projects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data projects'
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
     * Get accepted quotations for company creation (AJAX endpoint).
     */
    public function getAcceptedQuotations()
    {
        try {
            \Log::info('Fetching accepted quotations for company creation');
            
            $quotations = Quotation::with(['lead'])
                ->where('status', 'accepted')
                ->where('deleted', 0)
                ->whereDoesntHave('company')
                ->orderBy('accepted_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->select([
                    'id',
                    'quotation_number',
                    'subject',
                    'status',
                    'accepted_at',
                    'lead_id',
                    'total',
                    'created_at'
                ])
                ->limit(50)
                ->get()
                ->map(function($quotation) {
                    $leadData = null;
                    if ($quotation->lead) {
                        $leadData = [
                            'id' => $quotation->lead->id,
                            'company_name' => $quotation->lead->company_name,
                            'contact_person' => $quotation->lead->contact_person,
                            'email' => $quotation->lead->email,
                            'phone' => $quotation->lead->phone,
                            'address' => $quotation->lead->address,
                            'city' => $quotation->lead->city ?? null,
                            'province' => $quotation->lead->province ?? null,
                            'country' => $quotation->lead->country ?? null,
                        ];
                    }
                    
                    return [
                        'id' => $quotation->id,
                        'quotation_number' => $quotation->quotation_number,
                        'subject' => $quotation->subject,
                        'status' => $quotation->status,
                        'accepted_at' => $quotation->accepted_at ? $quotation->accepted_at->format('Y-m-d H:i:s') : null,
                        'total' => $quotation->total,
                        'created_at' => $quotation->created_at ? $quotation->created_at->format('Y-m-d H:i:s') : null,
                        'lead' => $leadData
                    ];
                });
                
            \Log::info('Found ' . $quotations->count() . ' accepted quotations without company');
            
            return response()->json([
                'success' => true,
                'data' => $quotations,
                'count' => $quotations->count()
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in getAcceptedQuotations: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
                'data' => [],
                'count' => 0
            ], 500);
        }
    }

    /**
     * Get lead data from quotation (AJAX endpoint).
     */
    public function getLeadFromQuotation($quotationId)
    {
        try {
            \Log::info('Fetching lead from quotation ID: ' . $quotationId);
            
            if (!$quotationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation ID is required'
                ], 400);
            }
            
            $quotation = Quotation::with(['lead'])
                ->where('id', $quotationId)
                ->where('deleted', 0)
                ->first();

            if (!$quotation) {
                \Log::warning('Quotation not found: ' . $quotationId);
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found'
                ], 404);
            }

            if ($quotation->status !== 'accepted') {
                \Log::warning('Quotation not accepted: ' . $quotationId . ' status: ' . $quotation->status);
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation is not accepted'
                ], 400);
            }

            if (!$quotation->lead) {
                \Log::warning('No lead associated with quotation: ' . $quotationId);
                return response()->json([
                    'success' => false,
                    'message' => 'No lead associated with this quotation'
                ], 404);
            }

            if ($quotation->company) {
                \Log::warning('Company already exists for quotation: ' . $quotationId);
                return response()->json([
                    'success' => false,
                    'message' => 'A company has already been created from this quotation'
                ], 400);
            }

            \Log::info('Found lead for quotation: ' . $quotationId);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $quotation->lead->id,
                    'company_name' => $quotation->lead->company_name,
                    'contact_person' => $quotation->lead->contact_person,
                    'email' => $quotation->lead->email,
                    'phone' => $quotation->lead->phone,
                    'address' => $quotation->lead->address,
                    'city' => $quotation->lead->city,
                    'province' => $quotation->lead->province,
                    'country' => $quotation->lead->country,
                    'lead_statuses_id' => $quotation->lead->lead_statuses_id,
                    'status_name' => $quotation->lead->status_name ?? 'New',
                    'quotation_id' => $quotation->id,
                    'quotation_number' => $quotation->quotation_number,
                    'quotation_subject' => $quotation->subject,
                    'quotation_total' => $quotation->total,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching lead from quotation: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch lead data: ' . $e->getMessage()
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