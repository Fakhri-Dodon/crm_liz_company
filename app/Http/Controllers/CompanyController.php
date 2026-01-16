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
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */

public function index(Request $request)
{
    try {
        \Log::info('Companies index accessed - AUTH USER: ' . auth()->id());
        
        if (!auth()->check()) {
            \Log::warning('User not authenticated, redirecting to login');
            return redirect()->route('login');
        }
        
        // Query dengan relasi lengkap termasuk lead untuk mengambil company_name
        $query = Company::with(['clientType', 'primaryContact', 'lead' => function($q) {
            $q->select('id', 'company_name', 'address', 'contact_person', 'email', 'phone', 'position');
        }])
        ->orderBy('created_at', 'desc');

        // Pencarian termasuk company_name dari leads
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('client_code', 'like', "%{$search}%")
                  ->orWhereHas('lead', function($subQuery) use ($search) {
                      $subQuery->where('company_name', 'like', "%{$search}%")
                               ->orWhere('contact_person', 'like', "%{$search}%");
                  })
                  ->orWhereHas('primaryContact', function($subQuery) use ($search) {
                      $subQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%")
                               ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

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

        // **PERBAIKAN UTAMA: Format data dengan company_name dari leads**
        $formattedCompanies = $companies->through(function($company) {
            // **AMBIL COMPANY_NAME DARI LEADS** 
            $companyName = $company->lead ? $company->lead->company_name : $company->client_code;
            
            // Format alamat dari data company atau lead
            $addressParts = array_filter([
                $company->city,
                $company->province,
                $company->country
            ]);
            $formattedAddress = !empty($addressParts) 
                ? implode(', ', $addressParts) 
                : ($company->lead ? $company->lead->address : 'N/A');

            // Data untuk modal edit
            return [
                // ID dan kode
                'id' => $company->id,
                'name' => $companyName, // **INI ADALAH company_name DARI LEADS**
                'client_code' => $company->client_code,
                
                // Client type
                'client_type_id' => $company->client_type_id,
                'client_type_name' => $company->clientType->name ?? 'N/A',
                
                // Contact person data (ambil dari primaryContact atau lead)
                'contact_person' => $company->primaryContact 
                    ? $company->primaryContact->name 
                    : ($company->lead ? $company->lead->contact_person : 'N/A'),
                'email' => $company->primaryContact 
                    ? $company->primaryContact->email 
                    : ($company->lead ? $company->lead->email : 'N/A'),
                'phone' => $company->primaryContact 
                    ? $company->primaryContact->phone 
                    : ($company->lead ? $company->lead->phone : 'N/A'),
                'contact_position' => $company->primaryContact 
                    ? $company->primaryContact->position 
                    : ($company->lead ? $company->lead->position : 'Contact Person'),
                
                // Location info
                'address' => $formattedAddress,
                'city' => $company->city,
                'province' => $company->province,
                'country' => $company->country,
                'postal_code' => $company->postal_code,
                
                // Business details
                'vat_number' => $company->vat_number,
                'nib' => $company->nib,
                'website' => $company->website,
                
                // Status dan tanggal
                'is_active' => (bool) $company->is_active,
                'client_since' => $company->client_since ? $company->client_since->format('Y-m-d') : null,
                'created_at' => $company->created_at,
                'updated_at' => $company->updated_at,
                
                // Logo
                'logo_url' => $company->logo_path ? Storage::url($company->logo_path) : null,
                'logo_path' => $company->logo_path,
                
                // **DATA UTUH UNTUK MODAL EDIT - INI YANG PENTING!**
                'company_name' => $companyName, // **Field ini untuk modal edit**
                'primary_contact' => $company->primaryContact ? [
                    'name' => $company->primaryContact->name,
                    'email' => $company->primaryContact->email,
                    'phone' => $company->primaryContact->phone,
                    'position' => $company->primaryContact->position
                ] : null,
                
                'lead' => $company->lead ? [
                    'id' => $company->lead->id,
                    'company_name' => $company->lead->company_name, // **DARI LEADS**
                    'address' => $company->lead->address,
                    'contact_person' => $company->lead->contact_person,
                    'email' => $company->lead->email,
                    'phone' => $company->lead->phone,
                    'position' => $company->lead->position,
                    'city' => '', // Lead mungkin tidak punya city
                    'province' => '', // Lead mungkin tidak punya province
                    'country' => '', // Lead mungkin tidak punya country
                    'postal_code' => '' // Lead mungkin tidak punya postal_code
                ] : null,
                
                // Original data dari companies table
                '_raw' => [
                    'client_type_id' => $company->client_type_id,
                    'city' => $company->city,
                    'province' => $company->province,
                    'country' => $company->country,
                    'postal_code' => $company->postal_code,
                    'vat_number' => $company->vat_number,
                    'nib' => $company->nib,
                    'website' => $company->website,
                    'is_active' => $company->is_active,
                    'lead_id' => $company->lead_id
                ]
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

        // Get all client types for filter dan modal edit
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
            'companies' => $formattedCompanies,
            'statistics' => $statistics,
            'types' => $types,
            'clientTypes' => $types, // Data untuk modal edit
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
            \Log::info('Request data:', $request->except(['logo']));
            \Log::info('Has logo file:', ['has_logo' => $request->hasFile('logo')]);
            
            // **VALIDASI**
            $validator = Validator::make($request->all(), [
                'company_name' => 'required|string|max:255',
                'client_type_id' => 'nullable|string|max:36', // Sementara nullable
                'contact_person' => 'required|string|max:255',
                'contact_email' => 'required|email|max:255',
                'contact_phone' => 'required|string|max:20',
                'contact_position' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'vat_number' => 'nullable|string|max:50',
                'nib' => 'nullable|string|max:255',
                'website' => 'nullable|url|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'status' => 'required|in:active,inactive',
                'quotation_id' => 'nullable|exists:quotations,id',
                'lead_id' => 'nullable|exists:leads,id'
            ], [
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
            $leadData = null;
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
                
                // Ambil data lead
                $leadData = Lead::find($leadId);
                
                \Log::info('Membuat perusahaan dari quotation:', [
                    'quotation_id' => $quotation->id,
                    'lead_id' => $leadId,
                    'lead_data' => $leadData ? 'found' : 'not found'
                ]);
            } else if ($request->lead_id) {
                // Jika ada lead_id langsung (tanpa quotation)
                $leadData = Lead::find($request->lead_id);
            }

            // **GENERATE CLIENT CODE**
            // Buat kode unik untuk client
            $prefix = 'CLT';
            $companyCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $request->company_name), 0, 5));
            $timestamp = date('YmdHis');
            $random = rand(100, 999);
            
            $clientCode = "{$prefix}-{$companyCode}-{$timestamp}{$random}";

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
                    
                    // Buat nama file unik
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $logoPath = $file->storeAs('companies/logos', $filename, 'public');
                    \Log::info('Logo saved to:', ['path' => $logoPath]);
                } catch (\Exception $e) {
                    \Log::error('Logo upload failed:', ['error' => $e->getMessage()]);
                    // Lanjut tanpa logo jika upload gagal
                }
            }

            // **SIMPAN DATA PERUSAHAAN (COMPANY)**
            // Jika client_type_id kosong, buat default UUID
            $clientTypeId = $request->client_type_id;
            if (empty($clientTypeId)) {
                // Gunakan UUID default atau null
                $clientTypeId = '550e8400-e29b-41d4-a716-446655440000'; // Default UUID
            }
            
            $companyData = [
                'id' => Str::uuid(),
                'client_type_id' => $clientTypeId,
                'lead_id' => $leadId,
                'quotation_id' => $request->quotation_id,
                'client_code' => $clientCode,
                'client_since' => now()->format('Y-m-d'),
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'postal_code' => $request->postal_code,
                'vat_number' => $request->vat_number,
                'nib' => $request->nib,
                'website' => $request->website,
                'logo_path' => $logoPath,
                'is_active' => $request->status === 'active' ? 1 : 0,
                'deleted' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ];

            \Log::info('Creating company with data:', $companyData);
            
            $company = Company::create($companyData);

            \Log::info('Perusahaan berhasil dibuat:', [
                'id' => $company->id,
                'client_code' => $company->client_code
            ]);

            // **SIMPAN DATA KONTAK KE TABLE company_contact_persons**
            if ($leadId) {
                $contactData = [
                    'id' => Str::uuid(),
                    'company_id' => $company->id,
                    'lead_id' => $leadId,
                    'email' => $request->contact_email,
                    'phone' => $request->contact_phone,
                    'name' => $request->contact_person,
                    'position' => $request->contact_position ?? 'Contact Person',
                    'is_primary' => 1,
                    'is_active' => 1,
                    'deleted' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                \Log::info('Creating contact person with data:', $contactData);
                
                $contact = CompanyContactPerson::create($contactData);

                \Log::info('Kontak perusahaan berhasil dibuat:', [
                    'id' => $contact->id,
                    'company_id' => $contact->company_id,
                    'lead_id' => $contact->lead_id,
                    'position' => $contact->position
                ]);
            } else {
                \Log::warning('No lead_id, skipping contact person creation');
            }

            // **UPDATE LEAD STATUS JIKA ADA**
            // Hapus bagian yang menggunakan LeadStatus jika model tidak ada
            // atau ganti dengan cara lain
            if ($leadData) {
                // Coba update lead jika ada field status
                try {
                    // Cek jika lead memiliki field status atau lead_statuses_id
                    if (isset($leadData->status)) {
                        $leadData->update([
                            'status' => 'converted_to_client',
                            'updated_at' => now()
                        ]);
                    } elseif (isset($leadData->lead_statuses_id)) {
                        // Jika ada lead_statuses_id, cari status 'converted' di database
                        $convertedStatusId = DB::table('lead_statuses')
                            ->where('name', 'like', '%client%')
                            ->orWhere('name', 'like', '%convert%')
                            ->value('id');
                            
                        if ($convertedStatusId) {
                            $leadData->update([
                                'lead_statuses_id' => $convertedStatusId,
                                'updated_at' => now()
                            ]);
                        }
                    }
                    
                    \Log::info('Lead updated if possible:', ['lead_id' => $leadData->id]);
                } catch (\Exception $e) {
                    \Log::warning('Failed to update lead status: ' . $e->getMessage());
                    // Lanjutkan tanpa error
                }
            }

            // **UPDATE QUOTATION NOTE JIKA ADA**
            if ($request->quotation_id && $quotationData) {
                $currentNote = $quotationData->note ?? '';
                $newNote = $currentNote . "\n\n[Converted to Company: " . $company->client_code . " on " . now()->format('Y-m-d H:i:s') . "]";
                
                $quotationData->update([
                    'note' => trim($newNote),
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
                    'company_name' => $request->company_name,
                    'contact_person' => $request->contact_person,
                    'contact_email' => $request->contact_email,
                    'contact_phone' => $request->contact_phone,
                    'contact_position' => $request->contact_position,
                    'logo_url' => $logoPath ? Storage::url($logoPath) : null,
                    'lead_id' => $leadId,
                    'quotation_id' => $request->quotation_id
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating company: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            \Log::error('Full error: ', ['exception' => $e]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat klien: ' . $e->getMessage(),
                'error_details' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            Log::info('=== SHOW COMPANY REQUEST ===');
            Log::info('Company ID: ' . $id);
            
            // Cari company berdasarkan ID (UUID) - TANPA contacts di with()
            $company = Company::with([
                'clientType',
                'lead',
                'quotation',
                'creator',
                'updater'
            ])->find($id);

            if (!$company) {
                Log::error('Company not found: ' . $id);
                return Inertia::render('Companies/Show', [
                    'company' => null,
                    'quotations' => [],
                    'grouped_quotations' => [],
                    'invoices' => [],
                    'payments' => [],
                    'projects' => [],
                    'contacts' => [],
                    'statistics' => [],
                    'error' => 'Company not found'
                ]);
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

            // QUERY SINGKAT DAN PASTI BEKERJA
            $invoices = DB::table('invoices as i')
                ->select([
                    'i.id',
                    'i.invoice_number',
                    'i.date',
                    'i.invoice_amout as invoice_amount',
                    'i.amount_due',
                    'i.status',
                    'i.payment_terms',
                    'i.payment_type',
                    'i.note',
                    'i.ppn',
                    'i.pph',
                    'i.total',
                    'i.deleted',
                    'i.deleted_by',
                    'i.created_at',
                    'i.updated_at',
                    'l.contact_person',
                    'l.email',
                    'l.phone',
                    'ccp.position',
                    'q.quotation_number',
                    'q.subject'
                ])
                ->join('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                ->leftJoin('leads as l', 'ccp.lead_id', '=', 'l.id')
                ->leftJoin('quotations as q', 'i.quotation_id', '=', 'q.id')
                ->where('ccp.company_id', $company->id)
                ->where('i.deleted', 0)
                ->orderBy('i.date', 'desc')
                ->get();

            Log::info('Invoices found: ' . $invoices->count());

            // Format data sederhana
            $formattedInvoices = $invoices->map(function($invoice) {
                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'date' => $invoice->date,
                    'invoice_amount' => (float) $invoice->invoice_amount,
                    'amount_due' => (float) $invoice->amount_due,
                    'status' => $invoice->status,
                    'payment_terms' => $invoice->payment_terms,
                    'payment_type' => $invoice->payment_type,
                    'note' => $invoice->note,
                    'ppn' => $invoice->ppn ? (float) $invoice->ppn : null,
                    'pph' => $invoice->pph ? (float) $invoice->pph : null,
                    'total' => $invoice->total ? (float) $invoice->total : null,
                    'created_at' => $invoice->created_at,
                    'updated_at' => $invoice->updated_at,
                    'contact_person' => $invoice->contact_person ? [
                        'name' => $invoice->contact_person,
                        'email' => $invoice->email,
                        'phone' => $invoice->phone,
                        'position' => $invoice->position
                    ] : null,
                    'quotation' => $invoice->quotation_number ? [
                        'quotation_number' => $invoice->quotation_number,
                        'subject' => $invoice->subject
                    ] : null
                ];
            });

            Log::info('=== END INVOICES FETCHING ===');
            // ==================== END INVOICES LOGIC ====================

            // ==================== PAYMENTS LOGIC ====================
            Log::info('=== START PAYMENTS FETCHING ===');
            
            // Ambil data payments dari database dengan informasi invoice
            $payments = DB::table('payments as p')
                ->select([
                    'p.id',
                    'p.invoice_id',
                    'p.amount',
                    'p.method',
                    'p.date',
                    'p.note',
                    'p.bank',
                    'p.created_by',
                    'p.updated_by',
                    'p.created_at',
                    'p.updated_at',
                    'i.invoice_number',
                    'i.invoice_amout as invoice_amount',
                    'i.amount_due',
                    'i.total as invoice_total',
                    'i.status as invoice_status',
                    'q.quotation_number',
                    'q.subject as quotation_subject',
                    'l.company_name',
                    'u.name as created_by_name',
                    'u2.name as updated_by_name'
                ])
                ->join('invoices as i', 'p.invoice_id', '=', 'i.id')
                ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                ->leftJoin('leads as l', 'ccp.lead_id', '=', 'l.id')
                ->leftJoin('quotations as q', 'i.quotation_id', '=', 'q.id')
                ->leftJoin('users as u', 'p.created_by', '=', 'u.id')
                ->leftJoin('users as u2', 'p.updated_by', '=', 'u2.id')
                ->where('ccp.company_id', $company->id)
                ->where('p.deleted', 0)
                ->orderBy('p.date', 'desc')
                ->orderBy('p.created_at', 'desc')
                ->get();
            
            // Format payments data
            $formattedPayments = $payments->map(function($payment) {
                return [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'invoice_number' => $payment->invoice_number,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'method_display' => $this->getPaymentMethodDisplay($payment->method),
                    'date' => $payment->date,
                    'note' => $payment->note,
                    'bank' => $payment->bank,
                    'created_by' => $payment->created_by_name ? [
                        'id' => $payment->created_by,
                        'name' => $payment->created_by_name
                    ] : null,
                    'updated_by' => $payment->updated_by_name ? [
                        'id' => $payment->updated_by,
                        'name' => $payment->updated_by_name
                    ] : null,
                    'created_at' => $payment->created_at,
                    'updated_at' => $payment->updated_at,
                    'invoice_amount' => (float) $payment->invoice_amount,
                    'amount_due' => (float) $payment->amount_due,
                    'invoice_total' => (float) $payment->invoice_total,
                    'invoice_status' => $payment->invoice_status,
                    'quotation' => $payment->quotation_number ? [
                        'quotation_number' => $payment->quotation_number,
                        'subject' => $payment->quotation_subject
                    ] : null,
                    'company_name' => $payment->company_name
                ];
            })->values();
            
            Log::info('Total payments found: ' . $formattedPayments->count());
            Log::info('=== END PAYMENTS FETCHING ===');
            // ==================== END PAYMENTS LOGIC ====================

            // ==================== PROJECTS LOGIC ====================
            Log::info('=== START PROJECTS FETCHING ===');
            
            // AMBIL DATA PROJECTS DENGAN QUERY YANG BENAR
            Log::info('Fetching projects for company ID: ' . $company->id);
            
            // Load dengan model untuk mendapatkan relationships
            $projects = Project::with(['assignedUser', 'quotation'])
                ->where('client_id', $company->id)
                ->where('deleted', 0)
                ->orderBy('created_at', 'desc')
                ->get();
            
            Log::info('Model query found: ' . $projects->count() . ' projects');
            
            // FORMAT DATA PROJECTS UNTUK RESPONSE
            $formattedProjects = $projects->map(function($project) {
                // Hitung days left
                $daysLeft = null;
                if ($project->deadline) {
                    try {
                        $deadline = Carbon::parse($project->deadline);
                        $today = Carbon::today();
                        $daysLeft = $today->diffInDays($deadline, false);
                        
                        // Jika deadline sudah lewat, buat negatif
                        if ($today > $deadline) {
                            $daysLeft = -abs($daysLeft);
                        }
                    } catch (\Exception $e) {
                        Log::error('Error parsing deadline for project ' . $project->id . ': ' . $e->getMessage());
                    }
                }
                
                // Hitung progress
                $progress = 0;
                $status = strtolower($project->status ?? 'pending');
                
                switch ($status) {
                    case 'completed':
                    case 'done':
                        $progress = 100;
                        break;
                    case 'in_progress':
                    case 'progress':
                    case 'active':
                        if ($daysLeft !== null && $daysLeft > 0) {
                            // Contoh: jika deadline masih 30 hari, progress = 30%
                            $progress = min(95, max(10, 100 - ($daysLeft * 2)));
                        } else if ($daysLeft !== null && $daysLeft <= 0) {
                            // Sudah lewat deadline tapi masih in progress
                            $progress = 95;
                        } else {
                            $progress = 50;
                        }
                        break;
                    case 'delayed':
                    case 'overdue':
                        $progress = 100;
                        break;
                    case 'pending':
                    case 'draft':
                    case 'new':
                        $progress = 10;
                        break;
                    case 'on_hold':
                    case 'hold':
                        $progress = 30;
                        break;
                    default:
                        $progress = 30;
                }
                
                // Helper function untuk format tanggal
                $formatDate = function($dateValue) {
                    if (!$dateValue) return null;
                    
                    if (is_string($dateValue)) {
                        try {
                            return Carbon::parse($dateValue)->format('Y-m-d');
                        } catch (\Exception $e) {
                            return $dateValue;
                        }
                    }
                    
                    if ($dateValue instanceof \DateTime || $dateValue instanceof \Carbon\Carbon) {
                        return $dateValue->format('Y-m-d');
                    }
                    
                    return null;
                };
                
                return [
                    'id' => $project->id,
                    'project_description' => $project->project_description ?? 'No Description',
                    'start_date' => $formatDate($project->start_date),
                    'deadline' => $formatDate($project->deadline),
                    'status' => $project->status ?? 'pending',
                    'note' => $project->note,
                    'days_left' => $daysLeft,
                    'progress' => $progress,
                    'assigned_user' => $project->assignedUser ? [
                        'id' => $project->assignedUser->id,
                        'name' => $project->assignedUser->name,
                        'email' => $project->assignedUser->email
                    ] : null,
                    'quotation' => $project->quotation ? [
                        'id' => $project->quotation->id,
                        'quotation_number' => $project->quotation->quotation_number,
                        'subject' => $project->quotation->subject
                    ] : null,
                    'created_at' => $project->created_at ? 
                        (is_string($project->created_at) ? 
                            $project->created_at : 
                            $project->created_at->format('Y-m-d H:i:s')) : null,
                    'updated_at' => $project->updated_at ? 
                        (is_string($project->updated_at) ? 
                            $project->updated_at : 
                            $project->updated_at->format('Y-m-d H:i:s')) : null
                ];
            })->values();
            
            Log::info('Formatted projects count: ' . $formattedProjects->count());
            Log::info('=== END PROJECTS FETCHING ===');
            // ==================== END PROJECTS LOGIC ====================

            // ==================== CONTACTS LOGIC - SIMPLE VERSION ====================
            Log::info('=== START SIMPLE CONTACTS PROCESSING ===');

            try {
                // JOIN dengan tabel leads untuk mendapatkan name, email, phone
                $contactsQuery = DB::table('company_contact_persons as ccp')
                    ->join('leads as l', 'ccp.lead_id', '=', 'l.id')
                    ->where('ccp.company_id', $company->id)
                    ->where('ccp.deleted', 0)
                    ->where('ccp.is_active', 1)
                    ->orderBy('ccp.is_primary', 'desc')
                    ->orderBy('l.contact_person', 'asc')
                    ->select([
                        'ccp.id',
                        'ccp.position',
                        'ccp.is_primary',
                        'ccp.is_active',
                        'ccp.created_at',
                        'ccp.updated_at',
                        'l.contact_person as name',  // Ambil dari leads
                        'l.email',                    // Ambil dari leads
                        'l.phone'                     // Ambil dari leads
                    ])
                    ->get();
                
                $formattedContacts = $contactsQuery->map(function($contact) {
                    return [
                        'id' => $contact->id,
                        'name' => $contact->name ?? 'No Name',
                        'email' => $contact->email ?? 'No Email',
                        'phone' => $contact->phone ?? 'No Phone',
                        'position' => $contact->position ?? 'No Position',
                        'is_primary' => (bool) ($contact->is_primary ?? false),
                        'is_active' => (bool) ($contact->is_active ?? true),
                        'created_at' => $contact->created_at ? 
                            (is_string($contact->created_at) ? 
                                $contact->created_at : 
                                Carbon::parse($contact->created_at)->format('Y-m-d H:i:s')) : null,
                        'updated_at' => $contact->updated_at ? 
                            (is_string($contact->updated_at) ? 
                                $contact->updated_at : 
                                Carbon::parse($contact->updated_at)->format('Y-m-d H:i:s')) : null
                    ];
                })->values();
                
                Log::info('Simple contacts query found: ' . $formattedContacts->count());
                Log::info('Sample contact:', $formattedContacts->first() ?: 'No contacts');
                
            } catch (\Exception $e) {
                Log::error('Error in simple contacts processing: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                $formattedContacts = collect([]);
            }

            // Get primary contact from formatted contacts
            $primaryContact = $formattedContacts->firstWhere('is_primary', true);

            Log::info('=== END SIMPLE CONTACTS PROCESSING ===');
            // ==================== END CONTACTS LOGIC ====================

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
                'contact_person' => $primaryContact ? $primaryContact['name'] : null,
                'contact_email' => $primaryContact ? $primaryContact['email'] : null,
                'contact_phone' => $primaryContact ? $primaryContact['phone'] : null,
                'contact_position' => $primaryContact ? $primaryContact['position'] : null,
                'primary_contact' => $primaryContact ? [
                    'name' => $primaryContact['name'],
                    'email' => $primaryContact['email'],
                    'phone' => $primaryContact['phone'],
                    'position' => $primaryContact['position']
                ] : null,
                'contacts' => $formattedContacts,
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
            Log::info('Payments count: ' . $formattedPayments->count());
            Log::info('Projects count: ' . $formattedProjects->count());
            Log::info('Contacts count: ' . $formattedContacts->count());

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
                'paid_invoices' => $formattedInvoices->where('status', 'Paid')->count(),
                'unpaid_invoices' => $formattedInvoices->where('status', 'Unpaid')->count(),
                'draft_invoices' => $formattedInvoices->where('status', 'Draft')->count(),
                'cancelled_invoices' => $formattedInvoices->where('status', 'Cancelled')->count(),
                'partial_invoices' => $formattedInvoices->where('status', 'Partial')->count(),
                'total_invoice_amount' => $formattedInvoices->sum('invoice_amount'),
                'total_amount_due' => $formattedInvoices->sum('amount_due'),
                
                // Payment statistics
                'total_payments' => $formattedPayments->count(),
                'total_payment_amount' => $formattedPayments->sum('amount'),
                'transfer_payments' => $formattedPayments->where('method', 'transfer')->count(),
                'cash_payments' => $formattedPayments->where('method', 'cash')->count(),
                'check_payments' => $formattedPayments->where('method', 'check')->count(),
                'average_payment_amount' => $formattedPayments->count() > 0 ? 
                    $formattedPayments->sum('amount') / $formattedPayments->count() : 0,
                'payment_ratio' => $formattedInvoices->sum('invoice_amount') > 0 ? 
                    ($formattedPayments->sum('amount') / $formattedInvoices->sum('invoice_amount')) * 100 : 0,
                
                // Project statistics
                'total_projects' => $formattedProjects->count(),
                'active_projects' => $formattedProjects->whereIn('status', ['in_progress', 'progress', 'active'])->count(),
                'completed_projects' => $formattedProjects->where('status', 'completed')->count(),
                'pending_projects' => $formattedProjects->whereIn('status', ['pending', 'draft', 'new'])->count(),
                'delayed_projects' => $formattedProjects->where('status', 'delayed')->count(),
                'overdue_projects' => $formattedProjects->where('days_left', '<', 0)->count(),
                'projects_with_assignee' => $formattedProjects->where('assigned_user', '!=', null)->count(),
                
                // Contact statistics
                'active_contacts' => $formattedContacts->count(),
                'primary_contacts' => $formattedContacts->where('is_primary', true)->count(),
                
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
            Log::info('Final data counts:', [
                'quotations' => $formattedQuotations->count(),
                'invoices' => $formattedInvoices->count(),
                'payments' => $formattedPayments->count(),
                'projects' => $formattedProjects->count(),
                'contacts' => $formattedContacts->count()
            ]);

            return Inertia::render('Companies/Show', [
                'company' => $companyData,
                'quotations' => $formattedQuotations,
                'grouped_quotations' => $groupedQuotations,
                'invoices' => $formattedInvoices,
                'payments' => $formattedPayments,
                'projects' => $formattedProjects,
                'contacts' => $formattedContacts,
                'statistics' => $statistics
            ]);

        } catch (\Exception $e) {
            Log::error('Error in company show: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return redirect()->route('companies.index')->with('error', 'Error loading company data: ' . $e->getMessage());
        }
    }

/**
 * Helper function to get payment method display text
 */
private function getPaymentMethodDisplay($method)
{
    switch ($method) {
        case 'transfer':
            return 'Bank Transfer';
        case 'cash':
            return 'Cash';
        case 'check':
            return 'Check';
        default:
            return ucfirst($method);
    }
}

/**
 * Update an existing payment
 */
public function updatePayment(Request $request, $companyId, $paymentId)
{
    try {
        Log::info('Updating payment', [
            'company_id' => $companyId,
            'payment_id' => $paymentId,
            'data' => $request->all()
        ]);
        
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1',
            'method' => 'required|in:transfer,cash,check',
            'date' => 'required|date',
            'bank' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->with('error', 'Validation failed');
        }

        // Validasi bahwa payment dan company valid
        $company = Company::findOrFail($companyId);
        $payment = Payment::findOrFail($paymentId);
        
        // Cek payment belongs to company melalui invoice -> company_contact_persons
        $isValidPayment = DB::table('payments as p')
            ->join('invoices as i', 'p.invoice_id', '=', 'i.id')
            ->join('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
            ->where('p.id', $paymentId)
            ->where('ccp.company_id', $companyId)
            ->where('p.deleted', 0)
            ->exists();
        
        if (!$isValidPayment) {
            return redirect()->back()
                ->with('error', 'Payment does not belong to this company');
        }

        DB::beginTransaction();

        // Get invoice
        $invoice = Invoice::findOrFail($payment->invoice_id);

        // Calculate remaining without this payment
        $totalPaidWithoutThis = Payment::where('invoice_id', $payment->invoice_id)
            ->where('id', '!=', $payment->id)
            ->where('deleted', 0)
            ->sum('amount');
        
        $remainingWithoutThis = $invoice->amount_due - $totalPaidWithoutThis;
        
        // Check if new amount exceeds remaining
        if ($request->amount > $remainingWithoutThis) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'New payment amount exceeds available remaining. Available: Rp ' . number_format($remainingWithoutThis, 0, ',', '.'));
        }

        // Update payment
        $oldAmount = $payment->amount;
        $payment->update([
            'amount' => $request->amount,
            'method' => $request->method,
            'date' => $request->date,
            'bank' => $request->bank,
            'note' => $request->note,
            'updated_by' => auth()->id(),
        ]);

        // Update invoice status
        $newTotalPaid = $totalPaidWithoutThis + $request->amount;
        $newRemainingDue = $invoice->amount_due - $newTotalPaid;
        
        if ($newRemainingDue <= 0) {
            $invoice->status = 'Paid';
        } elseif ($newTotalPaid > 0 && $newTotalPaid < $invoice->amount_due) {
            $invoice->status = 'Partial';
        } else {
            $invoice->status = 'Unpaid';
        }
        
        $invoice->save();

        DB::commit();

        Log::info('Payment updated successfully', ['payment_id' => $payment->id]);

        return redirect()->back()
            ->with('success', 'Payment updated successfully');

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error updating payment: ' . $e->getMessage());
        
        return redirect()->back()
            ->with('error', 'Failed to update payment: ' . $e->getMessage());
    }
}

/**
 * Delete a payment (soft delete)
 */
public function destroyPayment($companyId, $paymentId)
{
    try {
        Log::info('Deleting payment', [
            'company_id' => $companyId,
            'payment_id' => $paymentId
        ]);
        
        // Validasi bahwa payment dan company valid
        $company = Company::findOrFail($companyId);
        $payment = Payment::findOrFail($paymentId);
        
        // Cek payment belongs to company melalui invoice -> company_contact_persons
        $isValidPayment = DB::table('payments as p')
            ->join('invoices as i', 'p.invoice_id', '=', 'i.id')
            ->join('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
            ->where('p.id', $paymentId)
            ->where('ccp.company_id', $companyId)
            ->where('p.deleted', 0)
            ->exists();
        
        if (!$isValidPayment) {
            return redirect()->back()
                ->with('error', 'Payment does not belong to this company');
        }

        DB::beginTransaction();

        // Get invoice
        $invoice = Invoice::findOrFail($payment->invoice_id);

        // Soft delete payment
        $payment->update([
            'deleted' => 1,
            'deleted_by' => auth()->id(),
            'deleted_at' => now(),
        ]);

        // Recalculate invoice status
        $totalPaid = Payment::where('invoice_id', $payment->invoice_id)
            ->where('deleted', 0)
            ->sum('amount');
        
        $remainingDue = $invoice->amount_due - $totalPaid;
        
        if ($remainingDue <= 0) {
            $invoice->status = 'Paid';
        } elseif ($totalPaid > 0 && $totalPaid < $invoice->amount_due) {
            $invoice->status = 'Partial';
        } else {
            $invoice->status = 'Unpaid';
        }
        
        $invoice->save();

        DB::commit();

        Log::info('Payment deleted successfully', ['payment_id' => $payment->id]);

        return redirect()->back()
            ->with('success', 'Payment deleted successfully');

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error deleting payment: ' . $e->getMessage());
        
        return redirect()->back()
            ->with('error', 'Failed to delete payment: ' . $e->getMessage());
    }
}


// CompanyController.php
public function getInvoice($companyId, $invoiceId)
{
    try {
        Log::info('=== GET INVOICE REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice ID: ' . $invoiceId);

        // Cari invoice
        $invoice = Invoice::find($invoiceId);
        
        if (!$invoice) {
            Log::error('Invoice not found: ' . $invoiceId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Verifikasi invoice milik company tersebut
        $companyContactPerson = DB::table('company_contact_persons')
            ->where('id', $invoice->company_contact_persons_id)
            ->where('company_id', $companyId)
            ->first();

        if (!$companyContactPerson) {
            Log::error('Invoice does not belong to company: ' . $companyId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice does not belong to this company'
            ], 403);
        }

        // Format response
        $formattedInvoice = [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'date' => $invoice->date,
            'invoice_amount' => (float) $invoice->invoice_amout,
            'amount_due' => (float) $invoice->amount_due,
            'status' => $invoice->status,
            'payment_terms' => $invoice->payment_terms,
            'payment_type' => $invoice->payment_type,
            'note' => $invoice->note,
            'ppn' => $invoice->ppn ? (float) $invoice->ppn : null,
            'pph' => $invoice->pph ? (float) $invoice->pph : null,
            'total' => $invoice->total ? (float) $invoice->total : null,
            'created_at' => $invoice->created_at,
            'updated_at' => $invoice->updated_at
        ];

        return response()->json([
            'success' => true,
            'message' => 'Invoice retrieved successfully',
            'data' => $formattedInvoice
        ]);

    } catch (\Exception $e) {
        Log::error('Error getting invoice: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error getting invoice: ' . $e->getMessage()
        ], 500);
    }
}
/**
 * Get invoices related to a company via contact persons (WORKING VERSION)
 */
private function getCompanyInvoices(Company $company)
{
    Log::info('=== GET COMPANY INVOICES ===');
    Log::info('Company ID: ' . $company->id);
    
    try {
        // Gunakan Eloquent dengan eager loading yang benar
        $invoices = Invoice::with([
                'contactPerson' => function($query) {
                    $query->where('deleted', 0)
                          ->with(['lead', 'company']);
                },
                'quotation'
            ])
            ->whereHas('contactPerson', function($query) use ($company) {
                $query->where('company_id', $company->id)
                      ->where('deleted', 0);
            })
            ->orderBy('date', 'desc')
            ->get();
        
        Log::info('Invoices found: ' . $invoices->count());
        
        // Debug: Tampilkan data yang ditemukan
        if ($invoices->count() > 0) {
            foreach ($invoices as $index => $invoice) {
                Log::info("Invoice {$index}:", [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'date' => $invoice->date,
                    'amount' => $invoice->invoice_amout,
                    'status' => $invoice->status,
                    'company_contact_persons_id' => $invoice->company_contact_persons_id,
                    'has_contact_person' => !is_null($invoice->contactPerson),
                    'contact_person_name' => $invoice->contactPerson && $invoice->contactPerson->lead 
                        ? $invoice->contactPerson->lead->contact_person 
                        : 'No name',
                    'contact_person_company_id' => $invoice->contactPerson ? $invoice->contactPerson->company_id : 'none'
                ]);
            }
        } else {
            Log::info('No invoices found via Eloquent, trying direct query...');
            
            // Fallback: Query langsung
            $invoices = DB::table('invoices')
                ->select('invoices.*')
                ->join('company_contact_persons', 'invoices.company_contact_persons_id', '=', 'company_contact_persons.id')
                ->where('company_contact_persons.company_id', $company->id)
                ->where('company_contact_persons.deleted', 0)
                ->orderBy('invoices.date', 'desc')
                ->get();
            
            Log::info('Direct query result: ' . $invoices->count());
            
            // Convert to Eloquent models jika ditemukan
            if ($invoices->isNotEmpty()) {
                $invoiceIds = $invoices->pluck('id')->toArray();
                $invoices = Invoice::with(['contactPerson.lead', 'contactPerson.company', 'quotation'])
                    ->whereIn('id', $invoiceIds)
                    ->get();
            }
        }
        
        return $invoices;
        
    } catch (\Exception $e) {
        Log::error('Error in getCompanyInvoices: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return collect();
    }
}

public function updateInvoice($companyId, $invoiceId, Request $request)
{
    try {
        Log::info('=== UPDATE INVOICE REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice ID: ' . $invoiceId);
        Log::info('Request data:', $request->all());

        // Validasi data
        $validator = Validator::make($request->all(), [
            'invoice_number' => 'required|string|max:100',
            'date' => 'required|date',
            'invoice_amount' => 'required|numeric|min:0|max:999999999999', // Tambah max value
            'amount_due' => 'required|numeric|min:0|max:999999999999', // Tambah max value
            'status' => 'required|string|in:draft,unpaid,paid,cancelled,partial',
            'payment_terms' => 'nullable|string|max:255',
            'payment_type' => 'nullable|string|max:50|in:cash,transfer,check,credit_card', // Validasi pilihan
            'note' => 'nullable|string',
            'ppn' => 'nullable|numeric|min:0|max:999999999999',
            'pph' => 'nullable|numeric|min:0|max:999999999999',
            'total' => 'nullable|numeric|min:0|max:999999999999'
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Cari invoice
        $invoice = Invoice::find($invoiceId);
        
        if (!$invoice) {
            Log::error('Invoice not found: ' . $invoiceId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Verifikasi invoice milik company tersebut
        $companyContactPerson = DB::table('company_contact_persons')
            ->where('id', $invoice->company_contact_persons_id)
            ->where('company_id', $companyId)
            ->first();

        if (!$companyContactPerson) {
            Log::error('Invoice does not belong to company: ' . $companyId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice does not belong to this company'
            ], 403);
        }

        // Cek tipe data kolom di database
        Log::info('Database column types for invoice:');
        $columns = DB::select("DESCRIBE invoices");
        foreach ($columns as $column) {
            if (in_array($column->Field, ['invoice_amout', 'amount_due', 'ppn', 'pph', 'total'])) {
                Log::info("Column {$column->Field}: Type={$column->Type}, Null={$column->Null}");
            }
        }

        // Parse data numerik untuk memastikan format benar
        $updateData = [
            'invoice_number' => $request->invoice_number,
            'date' => $request->date,
            'invoice_amout' => (float) $request->invoice_amount,
            'amount_due' => (float) $request->amount_due,
            'status' => $request->status,
            'payment_terms' => $request->payment_terms,
            'payment_type' => $request->payment_type,
            'note' => $request->note,
            'ppn' => $request->ppn ? (float) $request->ppn : null,
            'pph' => $request->pph ? (float) $request->pph : null,
            'total' => $request->total ? (float) $request->total : null,
            'updated_by' => auth()->id() ?? null
        ];

        Log::info('Update data prepared:', $updateData);

        // Update data invoice
        $updated = $invoice->update($updateData);

        Log::info('Invoice update result:', [
            'success' => $updated,
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully',
            'data' => $invoice->fresh()
        ]);

    } catch (\Exception $e) {
        Log::error('Error updating invoice: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        // Debug lebih detail untuk SQL error
        if (strpos($e->getMessage(), 'SQLSTATE') !== false) {
            Log::error('SQL Error details:', [
                'error_code' => $e->getCode(),
                'sql_state' => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null,
                'error_message' => $e->errorInfo[2] ?? null
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Error updating invoice: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Mark invoice as paid
 */
public function markInvoiceAsPaid($companyId, $invoiceId)
{
    try {
        Log::info('=== MARK INVOICE AS PAID REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice ID: ' . $invoiceId);

        // Cari invoice
        $invoice = Invoice::find($invoiceId);
        
        if (!$invoice) {
            Log::error('Invoice not found: ' . $invoiceId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Verifikasi invoice milik company tersebut
        $companyContactPerson = DB::table('company_contact_persons')
            ->where('id', $invoice->company_contact_persons_id)
            ->where('company_id', $companyId)
            ->first();

        if (!$companyContactPerson) {
            Log::error('Invoice does not belong to company: ' . $companyId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice does not belong to this company'
            ], 403);
        }

        // Update status menjadi paid dan set amount_due menjadi 0
        $invoice->update([
            'status' => 'paid',
            'amount_due' => 0,
            'updated_by' => Auth::id() // PERBAIKAN INI
        ]);

        Log::info('Invoice marked as paid:', [
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice marked as paid successfully',
            'data' => $invoice
        ]);

    } catch (\Exception $e) {
        Log::error('Error marking invoice as paid: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error marking invoice as paid: ' . $e->getMessage()
        ], 500);
    }
}

public function deleteInvoice($companyId, $invoiceId)
{
    try {
        Log::info('=== DELETE INVOICE REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice ID: ' . $invoiceId);
        
        // Cari invoice dengan query builder untuk debug
        $invoice = DB::table('invoices')->where('id', $invoiceId)->first();
        
        if (!$invoice) {
            Log::error('Invoice not found: ' . $invoiceId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }
        
        Log::info('Invoice found:', [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'current_deleted' => $invoice->deleted,
            'company_contact_persons_id' => $invoice->company_contact_persons_id
        ]);

        // Verifikasi invoice milik company tersebut
        $companyContactPerson = DB::table('company_contact_persons')
            ->where('id', $invoice->company_contact_persons_id)
            ->where('company_id', $companyId)
            ->first();

        if (!$companyContactPerson) {
            Log::error('Invoice does not belong to company. Company ID: ' . $companyId);
            Log::error('Invoice CCP ID: ' . $invoice->company_contact_persons_id);
            
            // Debug: cek semua company_contact_persons untuk company ini
            $allCCP = DB::table('company_contact_persons')
                ->where('company_id', $companyId)
                ->get();
            Log::info('All CCP for company:', $allCCP->toArray());
            
            return response()->json([
                'success' => false,
                'message' => 'Invoice does not belong to this company'
            ], 403);
        }
        
        Log::info('Company contact person verified:', [
            'contact_person_id' => $companyContactPerson->id,
            'company_id' => $companyContactPerson->company_id
        ]);

        $userId = auth()->check() ? auth()->id() : 1; // Default ke user 1 jika tidak ada auth
        Log::info('User ID for deletion:', ['user_id' => $userId]);

        // Update dengan query builder untuk memastikan
        $updateData = [
            'deleted' => 1,
            'deleted_by' => $userId,
            'deleted_at' => now(),
            'updated_at' => now()
        ];
        
        Log::info('Attempting to update invoice with data:', $updateData);
        
        $updated = DB::table('invoices')
            ->where('id', $invoiceId)
            ->update($updateData);
        
        Log::info('Update result from DB:', [
            'rows_affected' => $updated,
            'success' => $updated > 0
        ]);
        
        // Cek hasil update
        $updatedInvoice = DB::table('invoices')->where('id', $invoiceId)->first();
        Log::info('After update - Invoice status:', [
            'deleted' => $updatedInvoice->deleted,
            'deleted_by' => $updatedInvoice->deleted_by,
            'deleted_at' => $updatedInvoice->deleted_at
        ]);

        if ($updated === 0) {
            Log::error('Failed to update invoice - no rows affected');
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice - no rows affected'
            ], 500);
        }

        Log::info('Invoice soft deleted successfully:', [
            'invoice_id' => $invoiceId,
            'company_id' => $companyId,
            'rows_affected' => $updated
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice deleted successfully',
            'data' => [
                'id' => $invoiceId,
                'deleted' => $updatedInvoice->deleted,
                'deleted_by' => $updatedInvoice->deleted_by,
                'rows_affected' => $updated
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Error deleting invoice: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error deleting invoice: ' . $e->getMessage(),
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Bulk delete invoices (soft delete)
 */
public function bulkDeleteInvoices($companyId, Request $request)
{
    try {
        Log::info('=== BULK DELETE INVOICES REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice IDs:', $request->all());

        $validator = Validator::make($request->all(), [
            'invoice_ids' => 'required|array',
            'invoice_ids.*' => 'required|exists:invoices,id'
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $invoiceIds = $request->invoice_ids;
        $deletedCount = 0;
        $currentUserId = auth()->id();

        // Loop melalui setiap invoice ID
        foreach ($invoiceIds as $invoiceId) {
            $invoice = Invoice::find($invoiceId);
            
            if ($invoice) {
                // Verifikasi invoice milik company tersebut
                $companyContactPerson = DB::table('company_contact_persons')
                    ->where('id', $invoice->company_contact_persons_id)
                    ->where('company_id', $companyId)
                    ->first();

                if ($companyContactPerson) {
                    // Soft delete
                    $invoice->update([
                        'deleted' => 1,
                        'deleted_by' => $currentUserId,
                        'deleted_at' => now()
                    ]);
                    $deletedCount++;
                }
            }
        }

        Log::info('Bulk delete completed:', [
            'requested' => count($invoiceIds),
            'deleted' => $deletedCount
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Successfully deleted ' . $deletedCount . ' invoice(s)',
            'deleted_count' => $deletedCount
        ]);

    } catch (\Exception $e) {
        Log::error('Error bulk deleting invoices: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error bulk deleting invoices: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Bulk mark invoices as paid
 */
public function bulkMarkInvoicesAsPaid($companyId, Request $request)
{
    try {
        Log::info('=== BULK MARK INVOICES AS PAID REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice IDs:', $request->all());

        $validator = Validator::make($request->all(), [
            'invoice_ids' => 'required|array',
            'invoice_ids.*' => 'required|exists:invoices,id'
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $invoiceIds = $request->invoice_ids;
        $updatedCount = 0;

        // Loop melalui setiap invoice ID
        foreach ($invoiceIds as $invoiceId) {
            $invoice = Invoice::find($invoiceId);
            
            if ($invoice && $invoice->status !== 'paid') {
                // Verifikasi invoice milik company tersebut
                $companyContactPerson = DB::table('company_contact_persons')
                    ->where('id', $invoice->company_contact_persons_id)
                    ->where('company_id', $companyId)
                    ->first();

                if ($companyContactPerson) {
                    $invoice->update([
                        'status' => 'paid',
                        'amount_due' => 0,
                        'updated_by' => Auth::id()
                    ]);
                    $updatedCount++;
                }
            }
        }

        Log::info('Bulk mark as paid completed:', [
            'requested' => count($invoiceIds),
            'updated' => $updatedCount
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Successfully marked ' . $updatedCount . ' invoice(s) as paid',
            'updated_count' => $updatedCount
        ]);

    } catch (\Exception $e) {
        Log::error('Error bulk marking invoices as paid: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error bulk marking invoices as paid: ' . $e->getMessage()
        ], 500);
    }
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

// app/Http/Controllers/CompanyController.php

/**
 * Get accepted quotations for company creation - ONLY UNUSED QUOTATIONS
 */
public function getAcceptedQuotations(Request $request)
{
    try {
        // Ambil semua quotations yang accepted dan belum memiliki client
        $quotations = Quotation::with(['lead', 'company'])
            ->where(function($query) {
                // Filter untuk status accepted (dalam berbagai format)
                $query->where('status', 'accepted')
                    ->orWhere('status', 'Accepted')
                    ->orWhere('status', 'ACCEPTED')
                    ->orWhere('status', 'Accepté')
                    ->orWhereRaw('LOWER(status) LIKE ?', ['%accept%']);
            })
            ->where('deleted', 0)
            ->whereDoesntHave('company') // HANYA quotations yang belum memiliki client
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
                    'has_company' => $quotation->company ? true : false, // Flag untuk UI
                    'lead' => $quotation->lead ? [
                        'id' => $quotation->lead->id,
                        'company_name' => $quotation->lead->company_name,
                        'contact_person' => $quotation->lead->contact_person,
                        'email' => $quotation->lead->email,
                        'phone' => $quotation->lead->phone,
                        'position' => $quotation->lead->position
                    ] : null
                ];
            });
        
        return response()->json([
            'success' => true,
            'message' => 'Data quotations yang belum digunakan berhasil diambil',
            'data' => $quotations,
            'total' => $quotations->count()
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error fetching accepted quotations: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data quotations',
            'data' => []
        ], 500);
    }
}

/**
 * Get lead data from quotation for company creation
 * - Tambahkan validasi bahwa quotation belum memiliki client
 */
public function getLeadFromQuotation($quotationId)
{
    try {
        \Log::info('Fetching lead from quotation ID: ' . $quotationId);
        
        // Ambil quotation dengan lead data
        $quotation = Quotation::with(['lead', 'company'])
            ->where('id', $quotationId)
            ->where('deleted', 0)
            ->first();
        
        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation tidak ditemukan'
            ], 404);
        }
        
        // Cek apakah quotation sudah accepted
        if (!in_array(strtolower($quotation->status), ['accepted', 'accepté'])) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation belum di-accept'
            ], 400);
        }
        
        // CEK PENTING: Quotation sudah memiliki client?
        if ($quotation->company) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation ini sudah digunakan untuk membuat client',
                'company_name' => $quotation->company->company_name,
                'company_id' => $quotation->company->id
            ], 400);
        }
        
        $lead = $quotation->lead;
        
        if (!$lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead tidak ditemukan untuk quotation ini'
            ], 404);
        }
        
        // Format lead data
        $leadData = [
            'id' => $lead->id,
            'company_name' => $lead->company_name,
            'contact_person' => $lead->contact_person,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'position' => $lead->position,
            'address' => $lead->address,
            'city' => $lead->city,
            'province' => $lead->province,
            'country' => $lead->country,
            'postal_code' => $lead->postal_code,
            'website' => $lead->website,
            'vat_number' => $lead->vat_number ?? '',
            'nib' => $lead->nib ?? '',
            'industry' => $lead->industry,
            'source' => $lead->source,
            'status' => $lead->status,
            'created_at' => $lead->created_at ? $lead->created_at->format('Y-m-d H:i:s') : null
        ];
        
        \Log::info('Lead data found for quotation ' . $quotationId);
        
        return response()->json([
            'success' => true,
            'message' => 'Data lead berhasil diambil',
            'data' => $leadData
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error fetching lead from quotation: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data lead',
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
            'company_name' => 'required|string|max:255', // Hanya untuk validasi, tidak di-update
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
            
            // Contact person fields
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

        // **PERBAIKAN: Jangan update client_code dari company_name**
        // Hanya update fields yang boleh diubah
        $updateData = [
            'client_type_id' => $request->client_type_id,
            // 'client_code' => $request->company_name, // <-- INI DIHAPUS/TIDAK DIUPDATE
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

        \Log::info('Updating company with data (excluding client_code): ', $updateData);
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

        \Log::info('Company updated successfully (client_code unchanged): ', [
            'id' => $company->id,
            'client_code' => $company->client_code,
            'company_name_from_request' => $request->company_name
        ]);

        DB::commit();

        // Load fresh data with relationships
        $company->load(['clientType', 'primaryContact']);

        return response()->json([
            'success' => true,
            'message' => 'Klien dan kontak berhasil diperbarui!',
            'data' => [
                'id' => $company->id,
                'client_code' => $company->client_code, // Masih original
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
     * Get all contacts for a company
     */
public function getContacts($companyId)
{
    try {
        \Log::info('Fetching contacts for company:', ['company_id' => $companyId]);
        
        $contacts = CompanyContactPerson::where('company_id', $companyId)
            ->where('deleted', 0)
            ->get()
            ->map(function ($contact) {
                return [
                    'id' => $contact->id,
                    'name' => $contact->name, // Ambil dari company_contact_persons
                    'email' => $contact->email, // Ambil dari company_contact_persons
                    'phone' => $contact->phone, // Ambil dari company_contact_persons
                    'position' => $contact->position,
                    'is_primary' => (bool) $contact->is_primary,
                    'is_active' => (bool) $contact->is_active,
                    'lead_id' => $contact->lead_id,
                    'company_id' => $contact->company_id,
                    'created_at' => $contact->created_at ? $contact->created_at->format('Y-m-d H:i:s') : null
                ];
            });

        \Log::info('Contacts found:', ['count' => $contacts->count()]);
        
        return response()->json([
            'success' => true,
            'data' => $contacts
        ]);
    } catch (\Exception $e) {
        \Log::error('Error getting contacts: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to get contacts'
        ], 500);
    }
}


/**
 * Add new contact
 */
public function addContact(Request $request, $companyId)
{
    \Log::info('=== ADD CONTACT REQUEST ===');
    \Log::info('Company ID:', ['company_id' => $companyId]);
    \Log::info('Request data:', $request->all());
    
    DB::beginTransaction();
    try {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:100', // Max 100 sesuai database
            'phone' => 'required|string|max:50',
            'position' => 'nullable|string|max:100',
            'is_primary' => 'boolean',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if company exists
        $company = Company::where('id', $companyId)->where('deleted', 0)->first();
        if (!$company) {
            \Log::error('Company not found:', ['company_id' => $companyId]);
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        \Log::info('Company found:', ['company_name' => $company->client_code]);

        // Check if contact already exists with same email for this company
        $existingContact = CompanyContactPerson::where('email', $request->email)
            ->where('company_id', $companyId)
            ->where('deleted', 0)
            ->first();

        if ($existingContact) {
            \Log::warning('Contact already exists with this email:', ['email' => $request->email]);
            return response()->json([
                'success' => false,
                'message' => 'Contact with this email already exists for this company'
            ], 409);
        }

        // **PERBAIKAN 1: Buat lead untuk referensi**
        $lead = Lead::where('email', $request->email)->first();
        
        if (!$lead) {
            // Prepare lead data
            $leadData = [
                'id' => Str::uuid(),
                'company_name' => $company->client_code,
                'contact_person' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'deleted' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ];

            // Tambahkan lead_statuses_id jika kolom ada
            if (Schema::hasColumn('leads', 'lead_statuses_id')) {
                $defaultStatus = DB::table('lead_statuses')->first();
                if ($defaultStatus) {
                    $leadData['lead_statuses_id'] = $defaultStatus->id;
                }
            }

            // Tambahkan created_by jika ada auth
            if (auth()->check() && Schema::hasColumn('leads', 'created_by')) {
                $leadData['created_by'] = auth()->id();
                $leadData['updated_by'] = auth()->id();
            }

            \Log::info('Creating new lead with data:', $leadData);
            $lead = Lead::create($leadData);
        } else {
            \Log::info('Existing lead found:', ['lead_id' => $lead->id]);
            // Update existing lead
            $lead->update([
                'contact_person' => $request->name,
                'phone' => $request->phone,
                'updated_at' => now()
            ]);
        }

        // If setting as primary, update existing primary contacts
        if ($request->boolean('is_primary')) {
            CompanyContactPerson::where('company_id', $companyId)
                ->where('is_primary', true)
                ->where('deleted', 0)
                ->update(['is_primary' => false]);
            \Log::info('Updated existing primary contacts');
        }

        // **PERBAIKAN 2: Siapkan data lengkap sesuai struktur tabel**
        $contactData = [
            'id' => Str::uuid(),
            'company_id' => $companyId,
            'lead_id' => $lead->id, // Simpan lead_id untuk relasi
            'name' => $request->name,
            'email' => $request->email, // <-- INI YANG DITAMBAHKAN
            'phone' => $request->phone,
            'position' => $request->position ?: null,
            'is_primary' => $request->boolean('is_primary') ? 1 : 0,
            'is_active' => $request->boolean('is_active', true) ? 1 : 0,
            'deleted' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ];

        // Tambahkan created_by jika ada auth
        if (auth()->check()) {
            $contactData['created_by'] = auth()->id();
        }

        \Log::info('Creating contact with data:', $contactData);

        // Create contact person
        $contact = CompanyContactPerson::create($contactData);

        \Log::info('Contact created successfully:', ['contact_id' => $contact->id]);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Contact added successfully',
            'data' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'phone' => $contact->phone,
                'position' => $contact->position,
                'is_primary' => (bool) $contact->is_primary,
                'is_active' => (bool) $contact->is_active,
                'lead_id' => $contact->lead_id,
                'company_id' => $contact->company_id
            ]
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error adding contact: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to add contact: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Update contact
     */
public function updateContact(Request $request, $companyId, $contactId)
{
    \Log::info('=== UPDATE CONTACT REQUEST ===');
    \Log::info('Contact ID:', ['contact_id' => $contactId]);
    \Log::info('Request data:', $request->all());
    
    DB::beginTransaction();
    try {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'position' => 'nullable|string|max:100',
            'is_primary' => 'boolean',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $contact = CompanyContactPerson::where('id', $contactId)
            ->where('company_id', $companyId)
            ->where('deleted', 0)
            ->first();

        if (!$contact) {
            return response()->json([
                'success' => false,
                'message' => 'Contact not found'
            ], 404);
        }

        // Update lead data
        if ($contact->lead) {
            $contact->lead->update([
                'contact_person' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'updated_at' => now()
            ]);
        }

        // **PERBAIKAN: Cek apakah kolom name ada**
        $updateData = [
            'position' => $request->position,
            'is_primary' => $request->boolean('is_primary'),
            'is_active' => $request->boolean('is_active', true),
            'updated_at' => now()
        ];

        // Hanya update name jika kolomnya ada
        if (Schema::hasColumn('company_contact_persons', 'name')) {
            $updateData['name'] = $request->name;
        }

        // Update contact
        $contact->update($updateData);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Contact updated successfully',
            'data' => [
                'id' => $contact->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'position' => $contact->position,
                'is_primary' => $contact->is_primary,
                'is_active' => $contact->is_active
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error updating contact: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to update contact'
        ], 500);
    }
}

    /**
     * Delete contact
     */
    public function deleteContact($companyId, $contactId)
    {
        \Log::info('=== DELETE CONTACT REQUEST ===');
        \Log::info('Contact ID:', ['contact_id' => $contactId]);
        
        DB::beginTransaction();
        try {
            $contact = CompanyContactPerson::where('id', $contactId)
                ->where('company_id', $companyId)
                ->where('deleted', 0)
                ->first();

            if (!$contact) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contact not found'
                ], 404);
            }

            // Soft delete contact
            $contact->update([
                'deleted' => 1,
                'deleted_at' => now(),
                'updated_at' => now()
            ]);

            \Log::info('Contact soft deleted:', ['contact_id' => $contactId]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Contact deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting contact: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete contact'
            ], 500);
        }
    }

    /**
     * Toggle primary contact
     */
    public function togglePrimary($companyId, $contactId)
    {
        \Log::info('=== TOGGLE PRIMARY CONTACT ===');
        \Log::info('Contact ID:', ['contact_id' => $contactId]);
        
        DB::beginTransaction();
        try {
            // Set all contacts in this company to non-primary
            CompanyContactPerson::where('company_id', $companyId)
                ->where('deleted', 0)
                ->update(['is_primary' => false]);

            // Set selected contact as primary
            $contact = CompanyContactPerson::where('id', $contactId)
                ->where('company_id', $companyId)
                ->where('deleted', 0)
                ->first();

            if (!$contact) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contact not found'
                ], 404);
            }

            $contact->update([
                'is_primary' => true,
                'updated_at' => now()
            ]);

            \Log::info('Contact set as primary:', ['contact_id' => $contactId]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Primary contact updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error toggling primary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update primary contact'
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

// CompanyController.php
public function updateStatus(Request $request, $company)
{
    // Cari company
    $companyModel = Company::where('id', $company)->firstOrFail();
    
    // Validasi
    $validated = $request->validate([
        'is_active' => 'required|boolean'
    ]);
    
    // Update status
    $companyModel->update([
        'is_active' => $validated['is_active']
    ]);
    
    // Return Inertia response dengan data yang diperbarui
    return back()->with([
        'success' => 'Status updated successfully',
        'updated_company' => $companyModel->id
    ]);
}

}