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
            
            // Cari company berdasarkan ID (UUID)
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
                'company_name' => $company->company_name,
                'quotation_id' => $company->quotation_id,
                'lead_id' => $company->lead_id
            ]);

            // ==================== INVOICES LOGIC ====================
            Log::info('=== START INVOICES FETCHING ===');

            // PERBAIKAN: Cek semua invoice yang mungkin terkait dengan company ini
            $invoices = collect();
            try {
                Log::info('Executing improved invoices query...');
                Log::info('Company details:', [
                    'id' => $company->id,
                    'company_name' => $company->company_name,
                    'lead_id' => $company->lead_id
                ]);
                
                // STRATEGI 1: Cari melalui lead_id di contact_persons
                if ($company->lead_id) {
                    Log::info('Trying to find invoices via lead ID: ' . $company->lead_id);
                    
                    $invoices = DB::table('invoices as i')
                        ->select([
                            'i.id',
                            'i.invoice_number',
                            'i.date',
                            'i.invoice_amout',
                            'i.amount_due',
                            'i.status',
                            'i.payment_terms',
                            'i.payment_type',
                            'i.payment_percentage',
                            'i.note',
                            'i.ppn',
                            'i.pph',
                            'i.total',
                            'i.deleted',
                            'i.created_at',
                            'i.updated_at',
                            'ccp.name as contact_name',
                            'ccp.email as contact_email',
                            'ccp.phone as contact_phone',
                            'ccp.position as contact_position',
                            'q.quotation_number',
                            'q.subject'
                        ])
                        ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                        ->leftJoin('quotations as q', 'i.quotation_id', '=', 'q.id')
                        ->where('ccp.lead_id', $company->lead_id)
                        ->where('i.deleted', 0)
                        ->where('ccp.deleted', 0)
                        ->orderBy('i.date', 'desc')
                        ->get();
                        
                    Log::info('Invoices found via lead_id: ' . $invoices->count());
                }
                
                // STRATEGI 2: Jika tidak ditemukan via lead_id, coba direct company_id
                if ($invoices->count() === 0) {
                    Log::info('Trying to find invoices via direct company_id: ' . $company->id);
                    
                    $invoices = DB::table('invoices as i')
                        ->select([
                            'i.id',
                            'i.invoice_number',
                            'i.date',
                            'i.invoice_amout',
                            'i.amount_due',
                            'i.status',
                            'i.payment_terms',
                            'i.payment_type',
                            'i.payment_percentage',
                            'i.note',
                            'i.ppn',
                            'i.pph',
                            'i.total',
                            'i.deleted',
                            'i.created_at',
                            'i.updated_at',
                            'ccp.name as contact_name',
                            'ccp.email as contact_email',
                            'ccp.phone as contact_phone',
                            'ccp.position as contact_position',
                            'q.quotation_number',
                            'q.subject'
                        ])
                        ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                        ->leftJoin('quotations as q', 'i.quotation_id', '=', 'q.id')
                        ->where('ccp.company_id', $company->id)
                        ->where('i.deleted', 0)
                        ->where('ccp.deleted', 0)
                        ->orderBy('i.date', 'desc')
                        ->get();
                        
                    Log::info('Invoices found via direct company_id: ' . $invoices->count());
                }
                
                // STRATEGI 3: Jika masih tidak ada, coba cari semua invoice dan filter berdasarkan nama perusahaan
                if ($invoices->count() === 0) {
                    Log::info('Trying to find invoices by company name match...');
                    
                    $allPossibleInvoices = DB::table('invoices as i')
                        ->select([
                            'i.id',
                            'i.invoice_number',
                            'i.date',
                            'i.invoice_amout',
                            'i.amount_due',
                            'i.status',
                            'i.payment_terms',
                            'i.payment_type',
                            'i.payment_percentage',
                            'i.note',
                            'i.ppn',
                            'i.pph',
                            'i.total',
                            'i.deleted',
                            'i.created_at',
                            'i.updated_at',
                            'ccp.name as contact_name',
                            'ccp.email as contact_email',
                            'ccp.phone as contact_phone',
                            'ccp.position as contact_position',
                            'ccp.lead_id',
                            'l.company_name as lead_company_name',
                            'q.quotation_number',
                            'q.subject'
                        ])
                        ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                        ->leftJoin('leads as l', 'ccp.lead_id', '=', 'l.id')
                        ->leftJoin('quotations as q', 'i.quotation_id', '=', 'q.id')
                        ->where('i.deleted', 0)
                        ->where(function($query) {
                            $query->where('ccp.deleted', 0)
                                  ->orWhereNull('ccp.deleted');
                        })
                        ->orderBy('i.date', 'desc')
                        ->limit(100)
                        ->get();
                        
                    Log::info('Total possible invoices in system: ' . $allPossibleInvoices->count());
                    
                    // Filter manual berdasarkan kesamaan nama perusahaan
                    $invoices = $allPossibleInvoices->filter(function($invoice) use ($company) {
                        $companyName = $company->company_name;
                        $invoiceCompanyName = $invoice->lead_company_name ?? '';
                        
                        if (!$invoiceCompanyName) {
                            return false;
                        }
                        
                        // Jika nama perusahaan sama persis
                        if (strcasecmp(trim($invoiceCompanyName), trim($companyName)) === 0) {
                            return true;
                        }
                        
                        // Jika mengandung kata kunci yang sama
                        $companyWords = array_filter(explode(' ', strtolower($companyName)));
                        $invoiceWords = array_filter(explode(' ', strtolower($invoiceCompanyName)));
                        
                        $commonWords = array_intersect($companyWords, $invoiceWords);
                        if (count($commonWords) >= 1) {
                            return true;
                        }
                        
                        return false;
                    });
                    
                    Log::info('Invoices filtered by company name match: ' . $invoices->count());
                }
                
                if ($invoices->count() > 0) {
                    Log::info('Sample invoice data from database (first 2):');
                    foreach ($invoices->take(2) as $index => $invoice) {
                        Log::info("Invoice {$index}:", [
                            'id' => $invoice->id,
                            'invoice_number' => $invoice->invoice_number,
                            'date' => $invoice->date,
                            'invoice_amount' => $invoice->invoice_amout,
                            'amount_due' => $invoice->amount_due,
                            'status' => $invoice->status,
                            'contact_name' => $invoice->contact_name,
                            'contact_email' => $invoice->contact_email,
                            'has_contact' => !empty($invoice->contact_name)
                        ]);
                    }
                }
                
            } catch (\Exception $e) {
                Log::error('Error executing invoices query: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                $invoices = collect();
            }

            Log::info('Final invoices found in database: ' . $invoices->count());

            // Format data invoices untuk frontend
            $formattedInvoices = $invoices->map(function($invoice) {
                // Data contact person
                $contactPerson = null;
                if (isset($invoice->contact_name) && $invoice->contact_name) {
                    $contactPerson = [
                        'name' => $invoice->contact_name,
                        'email' => $invoice->contact_email ?? '',
                        'phone' => $invoice->contact_phone ?? '',
                        'position' => $invoice->contact_position ?? ''
                    ];
                }

                // Data quotation
                $quotation = null;
                if (isset($invoice->quotation_number) && $invoice->quotation_number) {
                    $quotation = [
                        'quotation_number' => $invoice->quotation_number,
                        'subject' => $invoice->subject ?? ''
                    ];
                }

                // Konversi tipe data numerik dengan validasi yang lebih baik
                $invoiceAmount = 0;
                if (isset($invoice->invoice_amout)) {
                    if (is_numeric($invoice->invoice_amout)) {
                        $invoiceAmount = (float) $invoice->invoice_amout;
                    } elseif (is_string($invoice->invoice_amout) && $invoice->invoice_amout !== '') {
                        $cleaned = preg_replace('/[^0-9.-]/', '', $invoice->invoice_amout);
                        $invoiceAmount = (float) $cleaned;
                    }
                }
                
                $amountDue = 0;
                if (isset($invoice->amount_due)) {
                    if (is_numeric($invoice->amount_due)) {
                        $amountDue = (float) $invoice->amount_due;
                    } elseif (is_string($invoice->amount_due) && $invoice->amount_due !== '') {
                        $cleaned = preg_replace('/[^0-9.-]/', '', $invoice->amount_due);
                        $amountDue = (float) $cleaned;
                    }
                }
                
                $ppn = 0;
                if (isset($invoice->ppn)) {
                    if (is_numeric($invoice->ppn)) {
                        $ppn = (float) $invoice->ppn;
                    } elseif (is_string($invoice->ppn) && $invoice->ppn !== '') {
                        $cleaned = preg_replace('/[^0-9.-]/', '', $invoice->ppn);
                        $ppn = (float) $cleaned;
                    }
                }
                
                $pph = 0;
                if (isset($invoice->pph)) {
                    if (is_numeric($invoice->pph)) {
                        $pph = (float) $invoice->pph;
                    } elseif (is_string($invoice->pph) && $invoice->pph !== '') {
                        $cleaned = preg_replace('/[^0-9.-]/', '', $invoice->pph);
                        $pph = (float) $cleaned;
                    }
                }
                
                $total = 0;
                if (isset($invoice->total)) {
                    if (is_numeric($invoice->total)) {
                        $total = (float) $invoice->total;
                    } elseif (is_string($invoice->total) && $invoice->total !== '') {
                        $cleaned = preg_replace('/[^0-9.-]/', '', $invoice->total);
                        $total = (float) $cleaned;
                    }
                }
                
                // Jika total 0 tapi ada invoice amount, hitung total
                if ($total === 0 && $invoiceAmount > 0) {
                    $total = $invoiceAmount + $ppn + $pph;
                }
                
                $paymentPercentage = null;
                if (isset($invoice->payment_percentage)) {
                    if (is_numeric($invoice->payment_percentage)) {
                        $paymentPercentage = (float) $invoice->payment_percentage;
                    } elseif (is_string($invoice->payment_percentage) && $invoice->payment_percentage !== '') {
                        $cleaned = preg_replace('/[^0-9.-]/', '', $invoice->payment_percentage);
                        $paymentPercentage = (float) $cleaned;
                    }
                }

                // Format date dengan validasi
                $invoiceDate = $invoice->date ?? now()->format('Y-m-d');
                if (!$invoiceDate || $invoiceDate === '0000-00-00') {
                    $invoiceDate = now()->format('Y-m-d');
                }
                
                $createdAt = $invoice->created_at ?? now()->format('Y-m-d H:i:s');
                if (!$createdAt || $createdAt === '0000-00-00 00:00:00') {
                    $createdAt = now()->format('Y-m-d H:i:s');
                }
                
                $updatedAt = $invoice->updated_at ?? now()->format('Y-m-d H:i:s');
                if (!$updatedAt || $updatedAt === '0000-00-00 00:00:00') {
                    $updatedAt = now()->format('Y-m-d H:i:s');
                }

                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number ?? 'INV-' . strtoupper(substr(md5(uniqid()), 0, 8)),
                    'date' => $invoiceDate,
                    'invoice_amount' => $invoiceAmount,
                    'amount_due' => $amountDue,
                    'status' => $invoice->status ?? 'Unpaid',
                    'payment_terms' => $invoice->payment_terms ?? '',
                    'payment_type' => $invoice->payment_type ?? '',
                    'payment_percentage' => $paymentPercentage,
                    'note' => $invoice->note ?? '',
                    'ppn' => $ppn,
                    'pph' => $pph,
                    'total' => $total,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                    'contact_person' => $contactPerson,
                    'quotation' => $quotation,
                    'debug' => [
                        'is_sample' => false,
                        'is_from_db' => true,
                        'raw_invoice_amount' => $invoice->invoice_amout ?? 'null',
                        'raw_amount_due' => $invoice->amount_due ?? 'null',
                        'has_contact' => !empty($contactPerson),
                        'has_quotation' => !empty($quotation)
                    ]
                ];
            });

            // HAPUS SAMA SEKALI BAGIAN SAMPLE DATA - HANYA TAMPILKAN DATA DARI DATABASE
            Log::info('Formatted invoices count from database: ' . $formattedInvoices->count());

            if ($formattedInvoices->count() === 0) {
                Log::info('No invoices found in database for company: ' . $company->company_name);
                // TIDAK BUAT SAMPLE DATA - BIARKAN KOSONG
            }

            Log::info('=== END INVOICES FETCHING ===');

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

            // ==================== PAYMENTS LOGIC ====================
            Log::info('=== START PAYMENTS FETCHING ===');
            Log::info('Fetching payments for company ID: ' . $company->id);
            Log::info('Company client_code: ' . $company->client_code);

            $payments = collect();
            try {
                // Pertama, cari semua contact persons untuk company ini
                $contactPersonIds = DB::table('company_contact_persons')
                    ->where('company_id', $company->id)
                    ->where('deleted', 0)
                    ->pluck('id');
                
                Log::info('Contact person IDs found: ' . $contactPersonIds->count());
                Log::info('Contact person IDs: ' . $contactPersonIds->toJson());
                
                if ($contactPersonIds->isEmpty()) {
                    Log::info('No contact persons found for company');
                } else {
                    // Cari invoices untuk contact persons ini
                    $invoiceIds = DB::table('invoices')
                        ->whereIn('company_contact_persons_id', $contactPersonIds)
                        ->where('deleted', 0)
                        ->pluck('id');
                    
                    Log::info('Invoice IDs found: ' . $invoiceIds->count());
                    
                    if ($invoiceIds->isEmpty()) {
                        Log::info('No invoices found for contact persons');
                    } else {
                        // Sekarang cari payments untuk invoices ini
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
                                
                                'ccp.id as contact_person_id',
                                'ccp.name as contact_name',
                                'ccp.email as contact_email',
                                'ccp.phone as contact_phone',
                                'ccp.position as contact_position',
                                'ccp.company_id',
                                
                                'c.id as company_id_direct',
                                'c.client_code',
                                
                                'u.name as created_by_name',
                                'u2.name as updated_by_name'
                            ])
                            ->join('invoices as i', 'p.invoice_id', '=', 'i.id')
                            ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                            ->leftJoin('companies as c', 'ccp.company_id', '=', 'c.id')
                            ->leftJoin('users as u', 'p.created_by', '=', 'u.id')
                            ->leftJoin('users as u2', 'p.updated_by', '=', 'u2.id')
                            ->where('p.deleted', 0)
                            ->where('i.deleted', 0)
                            ->where('ccp.deleted', 0)
                            ->whereIn('p.invoice_id', $invoiceIds)
                            ->orderBy('p.date', 'desc')
                            ->orderBy('p.created_at', 'desc')
                            ->get();
                            
                        Log::info('Payments found via invoice IDs: ' . $payments->count());
                    }
                }
                
                // Jika masih tidak ada, coba alternatif: cari via lead_id
                if ($payments->isEmpty() && $company->lead_id) {
                    Log::info('Trying to find payments via lead_id: ' . $company->lead_id);
                    
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
                            
                            'ccp.id as contact_person_id',
                            'ccp.name as contact_name',
                            'ccp.email as contact_email',
                            'ccp.phone as contact_phone',
                            'ccp.position as contact_position',
                            'ccp.company_id',
                            'ccp.lead_id',
                            
                            'c.id as company_id_direct',
                            'c.client_code',
                            
                            'u.name as created_by_name',
                            'u2.name as updated_by_name'
                        ])
                        ->join('invoices as i', 'p.invoice_id', '=', 'i.id')
                        ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
                        ->leftJoin('companies as c', 'ccp.company_id', '=', 'c.id')
                        ->leftJoin('users as u', 'p.created_by', '=', 'u.id')
                        ->leftJoin('users as u2', 'p.updated_by', '=', 'u2.id')
                        ->where('p.deleted', 0)
                        ->where('i.deleted', 0)
                        ->where('ccp.deleted', 0)
                        ->where('ccp.lead_id', $company->lead_id)
                        ->orderBy('p.date', 'desc')
                        ->orderBy('p.created_at', 'desc')
                        ->get();
                        
                    Log::info('Payments found via lead_id: ' . $payments->count());
                }
                
            } catch (\Exception $e) {
                Log::error('Error fetching payments: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                $payments = collect();
            }

            // Format data
            $formattedPayments = $payments->map(function($payment) use ($company) {
                $companyId = $payment->company_id ?? $payment->company_id_direct ?? $company->id;
                
                return [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'invoice_number' => $payment->invoice_number,
                    'amount' => (float) ($payment->amount ?? 0),
                    'method' => $payment->method,
                    'method_display' => $this->getPaymentMethodDisplay($payment->method),
                    'date' => $payment->date,
                    'note' => $payment->note,
                    'bank' => $payment->bank,
                    'company_id' => $companyId,
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
                    'invoice_amount' => (float) ($payment->invoice_amount ?? 0),
                    'amount_due' => (float) ($payment->amount_due ?? 0),
                    'invoice_total' => (float) ($payment->invoice_total ?? 0),
                    'invoice_status' => $payment->invoice_status,
                    'invoice' => [
                        'id' => $payment->invoice_id,
                        'invoice_number' => $payment->invoice_number,
                        'company_id' => $companyId,
                    ],
                    'contact_person' => $payment->contact_name ? [
                        'id' => $payment->contact_person_id,
                        'name' => $payment->contact_name,
                        'email' => $payment->contact_email,
                        'phone' => $payment->contact_phone,
                        'position' => $payment->contact_position,
                        'company_id' => $companyId
                    ] : null,
                    'company' => $companyId ? [
                        'id' => $companyId,
                        'client_code' => $payment->client_code ?? $company->client_code,
                    ] : null,
                    'debug' => [
                        'has_company_id' => !empty($companyId),
                        'source' => isset($payment->company_id) ? 'ccp.company_id' : 
                                    (isset($payment->company_id_direct) ? 'companies.id' : 'fallback')
                    ]
                ];
            })->values();

            Log::info('=== END PAYMENTS FETCHING - Total: ' . $formattedPayments->count() . ' ===');

            // ==================== PROJECTS LOGIC ====================
            Log::info('=== START PROJECTS FETCHING ===');
            
            $projects = collect();
            try {
                $projects = Project::with(['assignedUser', 'quotation'])
                    ->where('client_id', $company->id)
                    ->where('deleted', 0)
                    ->orderBy('created_at', 'desc')
                    ->get();
            } catch (\Exception $e) {
                Log::error('Error fetching projects: ' . $e->getMessage());
            }
            
            $formattedProjects = $projects->map(function($project) {
                // Hitung days left
                $daysLeft = null;
                if ($project->deadline) {
                    try {
                        $deadline = Carbon::parse($project->deadline);
                        $today = Carbon::today();
                        $daysLeft = $today->diffInDays($deadline, false);
                        
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
                            $progress = min(95, max(10, 100 - ($daysLeft * 2)));
                        } else if ($daysLeft !== null && $daysLeft <= 0) {
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
                
                return [
                    'id' => $project->id,
                    'project_description' => $project->project_description ?? 'No Description',
                    'start_date' => $project->start_date ? Carbon::parse($project->start_date)->format('Y-m-d') : null,
                    'deadline' => $project->deadline ? Carbon::parse($project->deadline)->format('Y-m-d') : null,
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
                    'created_at' => $project->created_at ? $project->created_at->format('Y-m-d H:i:s') : null,
                    'updated_at' => $project->updated_at ? $project->updated_at->format('Y-m-d H:i:s') : null
                ];
            })->values();
            
            Log::info('Formatted projects count: ' . $formattedProjects->count());
            Log::info('=== END PROJECTS FETCHING ===');

            // ==================== CONTACTS LOGIC ====================
            Log::info('=== START CONTACTS PROCESSING ===');

            $formattedContacts = collect();
            try {
                $contactsQuery = DB::table('company_contact_persons')
                    ->where('company_id', $company->id)
                    ->where('deleted', 0)
                    ->where('is_active', 1)
                    ->orderBy('is_primary', 'desc')
                    ->orderBy('name', 'asc')
                    ->select([
                        'id',
                        'name',
                        'email',
                        'phone',
                        'position',
                        'is_primary',
                        'is_active',
                        'created_at',
                        'updated_at'
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
                
                Log::info('Contacts found: ' . $formattedContacts->count());
                
            } catch (\Exception $e) {
                Log::error('Error in contacts processing: ' . $e->getMessage());
                $formattedContacts = collect([]);
            }

            $primaryContact = $formattedContacts->firstWhere('is_primary', true);

            Log::info('=== END CONTACTS PROCESSING ===');

            // ==================== COMPANY DATA ====================
            $companyData = [
                'id' => $company->id,
                'name' => $company->client_code,
                'client_code' => $company->client_code,
                'company_name' => $company->company_name,
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
                    $company->created_at->format('Y-m-d H:i:s') : null,
                'updated_at' => $company->updated_at ? 
                    $company->updated_at->format('Y-m-d H:i:s') : null
            ];

            // ==================== STATISTICS ====================
            $statistics = [
                // Quotation statistics
                'total_quotations' => $formattedQuotations->count(),
                'accepted_quotations' => $formattedQuotations->where('status', 'accepted')->count(),
                'expired_quotations' => $formattedQuotations->where('status', 'expired')->count(),
                'cancelled_quotations' => $formattedQuotations->where('status', 'rejected')->count(),
                'draft_quotations' => $formattedQuotations->where('status', 'draft')->count(),
                'sent_quotations' => $formattedQuotations->where('status', 'sent')->count(),
                
                // Invoice statistics - gunakan data dari database
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
            $groupedQuotations = $formattedQuotations->groupBy(function($quotation) {
                return $quotation['lead_id'] ?? 'no-lead';
            })->map(function($group, $leadId) {
                $lead = $group->first()['lead'] ?? null;
                
                return [
                    'lead_id' => $leadId !== 'no-lead' ? $leadId : null,
                    'lead' => $lead,
                    'count' => $group->count(),
                    'total_amount' => $group->sum('total'),
                    'quotations' => $group
                ];
            })->values();

            Log::info('=== ALL DATA PREPARED ===');
            Log::info('Counts:', [
                'quotations' => $formattedQuotations->count(),
                'invoices' => $formattedInvoices->count(),
                'payments' => $formattedPayments->count(),
                'projects' => $formattedProjects->count(),
                'contacts' => $formattedContacts->count()
            ]);

            return Inertia::render('Companies/Show', [
                'company' => $companyData,
                'quotations' => $formattedQuotations->values()->toArray(),
                'grouped_quotations' => $groupedQuotations->toArray(),
                'invoices' => $formattedInvoices->values()->toArray(),
                'payments' => $formattedPayments->values()->toArray(),
                'projects' => $formattedProjects->values()->toArray(),
                'contacts' => $formattedContacts->values()->toArray(),
                'statistics' => $statistics,
                'debug_info' => [
                    'invoices_count' => $formattedInvoices->count(),
                    'has_sample_data' => false, // SELALU FALSE KARENA TIDAK PAKAI SAMPLE DATA
                    'query_executed' => true,
                    'company_id' => $company->id,
                    'company_name' => $company->company_name,
                    'lead_id' => $company->lead_id
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in company show: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return Inertia::render('Companies/Show', [
                'company' => null,
                'quotations' => [],
                'grouped_quotations' => [],
                'invoices' => [],
                'payments' => [],
                'projects' => [],
                'contacts' => [],
                'statistics' => [],
                'error' => 'Error loading company data: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Helper function to get payment method display text
     */
    private function getPaymentMethodDisplay($method)
    {
        $methods = [
            'transfer' => 'Bank Transfer',
            'cash' => 'Cash',
            'check' => 'Check',
            'bank_transfer' => 'Bank Transfer',
            'credit_card' => 'Credit Card',
            'debit_card' => 'Debit Card',
            'online_payment' => 'Online Payment'
        ];
        
        return $methods[$method] ?? ucwords(str_replace('_', ' ', $method));
    }
    
/**
 * Get invoice for editing
 */
public function getInvoice($companyId, $invoiceId)
{
    try {
        Log::info('=== GET INVOICE REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice ID: ' . $invoiceId);

        // Cari company terlebih dahulu
        $company = Company::find($companyId);
        if (!$company) {
            Log::error('Company not found: ' . $companyId);
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        // PERBAIKAN: Query yang benar dengan validasi kepemilikan
        $invoice = DB::table('invoices as i')
            ->select([
                'i.id',
                'i.invoice_number',
                'i.date',
                'i.invoice_amout as invoice_amount', // PERBAIKAN: alias untuk konsistensi
                'i.amount_due',
                'i.status',
                'i.payment_terms',
                'i.payment_type',
                'i.payment_percentage',
                'i.note',
                'i.ppn',
                'i.pph',
                'i.total',
                'i.created_at',
                'i.updated_at',
                'i.company_contact_persons_id', // TAMBAHKAN INI untuk validasi
                'ccp.name as contact_name',
                'ccp.email as contact_email',
                'ccp.phone as contact_phone',
                'ccp.position as contact_position',
                'ccp.company_id as contact_company_id', // TAMBAHKAN INI untuk validasi
                'q.quotation_number',
                'q.subject'
            ])
            ->leftJoin('company_contact_persons as ccp', 'i.company_contact_persons_id', '=', 'ccp.id')
            ->leftJoin('quotations as q', 'i.quotation_id', '=', 'q.id')
            ->where('i.id', $invoiceId)
            ->where('i.deleted', 0)
            ->first();

        if (!$invoice) {
            Log::error('Invoice not found: ' . $invoiceId);
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // PERBAIKAN: Validasi kepemilikan company
        if ($invoice->contact_company_id != $companyId) {
            Log::error('Invoice does not belong to company', [
                'invoice_id' => $invoiceId,
                'invoice_company_id' => $invoice->contact_company_id,
                'requested_company_id' => $companyId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invoice does not belong to this company'
            ], 403);
        }

        Log::info('Invoice retrieved successfully:', [
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number
        ]);

        return response()->json([
            'success' => true,
            'data' => $invoice
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
 * Update an invoice
 */
public function updateInvoice($companyId, $invoiceId, Request $request)
{
    try {
        Log::info('=== UPDATE INVOICE REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Invoice ID: ' . $invoiceId);
        Log::info('Request data:', $request->all());
        Log::info('User ID: ' . (auth()->id() ?? 'Guest'));

        // Validasi data
        $validator = Validator::make($request->all(), [
            'invoice_number' => 'required|string|max:100',
            'date' => 'required|date',
            'invoice_amount' => 'required|numeric|min:0|max:999999999999',
            'amount_due' => 'required|numeric|min:0|max:999999999999',
            'status' => 'required|string|in:Draft,Paid,Unpaid,Partial,Cancelled',
            'payment_terms' => 'nullable|string|max:255',
            'payment_type' => 'nullable|string|max:50',
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

        // Cari invoice dengan relation untuk validasi
        $invoice = Invoice::with(['contactPerson' => function($query) {
            $query->select('id', 'company_id');
        }])->find($invoiceId);
        
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
            'contact_person_id' => $invoice->company_contact_persons_id,
            'has_contact_person' => !is_null($invoice->contactPerson)
        ]);

        // Verifikasi invoice milik company tersebut
        if (!$invoice->contactPerson) {
            Log::error('Contact person not found for invoice');
            return response()->json([
                'success' => false,
                'message' => 'Contact person not found for this invoice'
            ], 403);
        }

        if ($invoice->contactPerson->company_id != $companyId) {
            Log::error('Invoice does not belong to company', [
                'invoice_id' => $invoiceId,
                'invoice_company_id' => $invoice->contactPerson->company_id,
                'requested_company_id' => $companyId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invoice does not belong to this company'
            ], 403);
        }

        // Update data invoice
        $updateData = [
            'invoice_number' => $request->invoice_number,
            'date' => $request->date,
            'invoice_amout' => (float) $request->invoice_amount, // PERBAIKAN: gunakan nama kolom yang benar
            'amount_due' => (float) $request->amount_due,
            'status' => $request->status,
            'payment_terms' => $request->payment_terms,
            'payment_type' => $request->payment_type,
            'note' => $request->note,
            'ppn' => $request->ppn ? (float) $request->ppn : null,
            'pph' => $request->pph ? (float) $request->pph : null,
            'total' => $request->total ? (float) $request->total : null,
            'updated_by' => auth()->id() ?? null,
            'updated_at' => now()
        ];

        Log::info('Update data prepared:', $updateData);

        // Update data invoice
        $updated = $invoice->update($updateData);

        if ($updated) {
            Log::info('Invoice update successful:', [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number
            ]);
            
            // Reload fresh data dengan relations
            $freshInvoice = Invoice::with([
                'contactPerson' => function($query) {
                    $query->select('id', 'name', 'email', 'phone', 'position');
                },
                'quotation' => function($query) {
                    $query->select('id', 'quotation_number', 'subject');
                }
            ])->find($invoiceId);
            
            return response()->json([
                'success' => true,
                'message' => 'Invoice updated successfully',
                'data' => $freshInvoice
            ]);
        } else {
            Log::error('Failed to update invoice');
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice'
            ], 500);
        }

    } catch (\Exception $e) {
        Log::error('Error updating invoice: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error updating invoice: ' . $e->getMessage()
        ], 500);
    }
}
    
    /**
     * Delete an invoice (soft delete) - SIMPLIFIED VERSION
     */
    public function deleteInvoice($companyId, $invoiceId)
    {
        try {
            Log::info('Delete invoice request:', [
                'company_id' => $companyId,
                'invoice_id' => $invoiceId,
                'user_id' => auth()->id()
            ]);

            // Cari invoice
            $invoice = Invoice::find($invoiceId);
            
            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            // Verifikasi invoice milik company tersebut
            // Cara 1: Cek melalui company_contact_persons
            $companyContactPerson = DB::table('company_contact_persons')
                ->where('id', $invoice->company_contact_persons_id)
                ->where('company_id', $companyId)
                ->first();

            // Cara 2: Cek langsung jika ada relation direct
            if (!$companyContactPerson) {
                // Cek alternatif: jika invoice memiliki direct company_id
                if (isset($invoice->company_id) && $invoice->company_id != $companyId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invoice does not belong to this company'
                    ], 403);
                }
                
                // Atau skip verification jika tidak ada relasi yang jelas
                Log::warning('Company contact person not found, proceeding with deletion anyway');
            }

            // Soft delete invoice dengan cara Laravel standar
            $invoice->deleted = 1;
            $invoice->deleted_by = auth()->id();
            $invoice->deleted_at = now();
            $invoice->save();

            Log::info('Invoice deleted successfully:', [
                'invoice_id' => $invoiceId,
                'deleted_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully',
                'data' => [
                    'id' => $invoiceId,
                    'deleted' => 1
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting invoice: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error deleting invoice'
            ], 500);
        }
    }
    
    /**
     * Bulk delete invoices (soft delete) - SIMPLIFIED VERSION
     */
    public function bulkDeleteInvoices($companyId, Request $request)
    {
        try {
            Log::info('Bulk delete invoices request:', [
                'company_id' => $companyId,
                'invoice_ids' => $request->invoice_ids,
                'user_id' => auth()->id()
            ]);

            $validator = Validator::make($request->all(), [
                'invoice_ids' => 'required|array|min:1',
                'invoice_ids.*' => 'required|exists:invoices,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid invoice data',
                    'errors' => $validator->errors()
                ], 422);
            }

            $invoiceIds = $request->invoice_ids;
            $deletedCount = 0;

            // Delete semua invoice sekaligus dengan query yang lebih efisien
            $deleted = Invoice::whereIn('id', $invoiceIds)
                ->update([
                    'deleted' => 1,
                    'deleted_by' => auth()->id(),
                    'deleted_at' => now(),
                    'updated_at' => now()
                ]);

            $deletedCount = $deleted;

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
            
            return response()->json([
                'success' => false,
                'message' => 'Error deleting invoices'
            ], 500);
        }
    }
    
public function updatePayment(Request $request, $companyId, $paymentId)
{
    DB::beginTransaction();
    try {
        Log::info('=== UPDATE PAYMENT REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Payment ID: ' . $paymentId);
        Log::info('Request amount: ' . $request->amount);
        
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1',
            'method' => 'required|in:transfer,cash,check',
            'date' => 'required|date',
            'bank' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // 1. Cari payment dengan relasi invoice
        $payment = Payment::with(['invoice' => function($query) {
            $query->select('id', 'total', 'invoice_amout', 'amount_due', 'status', 'company_contact_persons_id');
        }])->find($paymentId);
        
        if (!$payment) {
            Log::error('Payment not found: ' . $paymentId);
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan'
            ], 404);
        }

        Log::info('Found payment:', [
            'id' => $payment->id,
            'invoice_id' => $payment->invoice_id,
            'current_amount' => $payment->amount,
            'new_amount_request' => $request->amount
        ]);

        // 2. Cek invoice
        $invoice = $payment->invoice;
        if (!$invoice) {
            Log::error('Invoice not found for payment: ' . $payment->invoice_id);
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan untuk payment ini'
            ], 404);
        }

        Log::info('Found invoice:', [
            'id' => $invoice->id,
            'total' => $invoice->total,
            'invoice_amout' => $invoice->invoice_amout,
            'current_amount_due' => $invoice->amount_due
        ]);

        // 3. BYPASS COMPANY VALIDATION UNTUK TESTING - FOKUS KE UPDATE AMOUNT DUE
        Log::warning('BYPASSING COMPANY VALIDATION FOR TESTING');
        
        /*
        // Jika mau validasi, uncomment ini:
        if ($invoice->company_contact_persons_id) {
            $contactPerson = CompanyContactPerson::find($invoice->company_contact_persons_id);
            if ($contactPerson && $contactPerson->company_id && $contactPerson->company_id != $companyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment tidak termasuk dalam company ini'
                ], 403);
            }
        }
        */

        // 4. SIMPAN OLD AMOUNT UNTUK PERHITUNGAN
        $oldAmount = $payment->amount;
        $newAmount = $request->amount;
        $amountDifference = $newAmount - $oldAmount;
        
        Log::info('Amount calculation:', [
            'old_amount' => $oldAmount,
            'new_amount' => $newAmount,
            'difference' => $amountDifference
        ]);

        // 5. HITUNG TOTAL INVOICE (gunakan yang ada)
        $totalInvoice = $invoice->total ?: ($invoice->invoice_amout ?: 0);
        
        Log::info('Invoice totals:', [
            'total' => $invoice->total,
            'invoice_amout' => $invoice->invoice_amout,
            'used_total' => $totalInvoice
        ]);

        // 6. HITUNG TOTAL PAYMENTS YANG AKTIF UNTUK INVOICE INI
        // INI BAGIAN PENTING: Hitung semua payment kecuali yang deleted
        $existingPayments = Payment::where('invoice_id', $invoice->id)
            ->where('id', '!=', $paymentId) // Exclude payment yang sedang diupdate
            ->where('deleted', 0)
            ->sum('amount');
        
        $totalAfterUpdate = $existingPayments + $newAmount;
        
        Log::info('Payment calculations:', [
            'existing_payments_sum' => $existingPayments,
            'new_payment_amount' => $newAmount,
            'total_after_update' => $totalAfterUpdate,
            'invoice_total' => $totalInvoice
        ]);

        // 7. VALIDASI: Total payments tidak boleh melebihi invoice total
        if ($totalAfterUpdate > $totalInvoice) {
            Log::warning('Payment exceeds invoice total:', [
                'total_invoice' => $totalInvoice,
                'total_payments' => $totalAfterUpdate
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Total pembayaran melebihi jumlah invoice. ' .
                            'Max yang boleh: Rp ' . number_format($totalInvoice - $existingPayments, 0, ',', '.')
            ], 422);
        }

        // 8. UPDATE PAYMENT
        $payment->update([
            'amount' => $newAmount,
            'method' => $request->method,
            'date' => $request->date,
            'bank' => $request->bank,
            'note' => $request->note,
            'updated_by' => auth()->id(),
            'updated_at' => now()
        ]);

        Log::info('Payment updated successfully');

        // 9. CALCULATE NEW AMOUNT DUE - INI BAGIAN YANG PERLU DIPERBAIKI!
        // Cara 1: Hitung dari awal berdasarkan semua payments
        $allPaymentsSum = Payment::where('invoice_id', $invoice->id)
            ->where('deleted', 0)
            ->sum('amount');
        
        $newAmountDue = $totalInvoice - $allPaymentsSum;
        
        // Pastikan tidak negatif
        $newAmountDue = max(0, $newAmountDue);
        
        Log::info('New amount due calculation:', [
            'method' => 'recalculate_from_scratch',
            'total_invoice' => $totalInvoice,
            'all_payments_sum' => $allPaymentsSum,
            'new_amount_due' => $newAmountDue,
            'old_amount_due' => $invoice->amount_due
        ]);

        // 10. UPDATE INVOICE AMOUNT_DUE
        $invoice->update([
            'amount_due' => $newAmountDue,
            'updated_by' => auth()->id(),
            'updated_at' => now()
        ]);

        Log::info('Invoice amount_due updated');

        // 11. UPDATE INVOICE STATUS
        $this->updateInvoiceStatus($invoice);

        // 12. COMMIT TRANSACTION
        DB::commit();

        // 13. RETURN RESPONSE
        return response()->json([
            'success' => true,
            'message' => 'Payment berhasil diupdate',
            'data' => [
                'payment' => [
                    'id' => $payment->id,
                    'old_amount' => $oldAmount,
                    'new_amount' => $payment->amount,
                    'difference' => $amountDifference
                ],
                'invoice' => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'old_amount_due' => $invoice->getOriginal('amount_due'),
                    'new_amount_due' => $newAmountDue,
                    'total_invoice' => $totalInvoice,
                    'total_paid' => $allPaymentsSum
                ],
                'calculation_details' => [
                    'total_invoice' => $totalInvoice,
                    'all_payments_sum' => $allPaymentsSum,
                    'amount_difference' => $amountDifference
                ]
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error updating payment: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengupdate payment: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Helper function untuk update invoice status
 */
/**
 * Update invoice status berdasarkan pembayaran
 */
private function updateInvoiceStatus($invoice)
{
    try {
        // Hitung total invoice
        $totalInvoice = $invoice->total ?: ($invoice->invoice_amout ?: 0);
        
        if ($totalInvoice == 0) {
            Log::warning('Invoice total is 0, skipping status update');
            return;
        }
        
        // Hitung total payment yang aktif
        $totalPaid = Payment::where('invoice_id', $invoice->id)
            ->where('deleted', 0)
            ->sum('amount');
        
        Log::info('Status calculation:', [
            'invoice_id' => $invoice->id,
            'total_invoice' => $totalInvoice,
            'total_paid' => $totalPaid,
            'percentage' => ($totalPaid / $totalInvoice) * 100
        ]);
        
        // Tentukan status
        $newStatus = 'Unpaid';
        
        if ($totalPaid >= $totalInvoice) {
            $newStatus = 'Paid';
        } elseif ($totalPaid > 0) {
            $newStatus = 'Partial';
        }
        
        // Update jika status berubah
        if ($invoice->status != $newStatus) {
            $oldStatus = $invoice->status;
            $invoice->update(['status' => $newStatus]);
            
            Log::info('Invoice status updated:', [
                'invoice_id' => $invoice->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ]);
        }
        
    } catch (\Exception $e) {
        Log::error('Error in updateInvoiceStatus: ' . $e->getMessage());
    }
}

/**
 * Helper function untuk recalculate invoice amount_due setelah delete/update
 */
private function recalculateInvoiceAmountDue($invoiceId)
{
    try {
        $invoice = Invoice::find($invoiceId);
        if (!$invoice) {
            Log::warning('Invoice not found for recalc: ' . $invoiceId);
            return null;
        }
        
        // Hitung total invoice
        $totalInvoice = $invoice->total ?: ($invoice->invoice_amout ?: 0);
        
        // Hitung total payment yang aktif (tidak deleted)
        $totalPaid = Payment::where('invoice_id', $invoiceId)
            ->where('deleted', 0)
            ->sum('amount');
        
        // Hitung amount_due baru
        $newAmountDue = $totalInvoice - $totalPaid;
        
        // Pastikan tidak negatif
        $newAmountDue = max(0, $newAmountDue);
        
        // Update invoice
        $invoice->update([
            'amount_due' => $newAmountDue,
            'updated_at' => now()
        ]);
        
        // Update status
        $this->updateInvoiceStatus($invoice);
        
        Log::info('Invoice recalculated:', [
            'invoice_id' => $invoiceId,
            'total_invoice' => $totalInvoice,
            'total_paid' => $totalPaid,
            'new_amount_due' => $newAmountDue
        ]);
        
        return [
            'total_invoice' => $totalInvoice,
            'total_paid' => $totalPaid,
            'amount_due' => $newAmountDue
        ];
        
    } catch (\Exception $e) {
        Log::error('Error recalculating invoice: ' . $e->getMessage());
        return null;
    }
}

/**
 * Delete a payment (soft delete) dan update invoice
 */
public function destroyPayment(Request $request, $companyId, $paymentId)
{
    DB::beginTransaction();
    try {
        Log::info('=== DELETE PAYMENT REQUEST ===');
        Log::info('Company ID: ' . $companyId);
        Log::info('Payment ID: ' . $paymentId);
        
        // 1. Cari payment
        $payment = Payment::find($paymentId);
        
        if (!$payment) {
            Log::warning('Payment not found: ' . $paymentId);
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan'
            ], 404);
        }

        // 2. Cek invoice untuk payment ini
        $invoice = Invoice::find($payment->invoice_id);
        if (!$invoice) {
            Log::warning('Invoice not found for payment: ' . $payment->invoice_id);
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan untuk payment ini'
            ], 404);
        }

        // 3. Cek contact person untuk invoice
        $contactPerson = CompanyContactPerson::find($invoice->company_contact_persons_id);
        if (!$contactPerson) {
            Log::warning('Contact person not found: ' . $invoice->company_contact_persons_id);
            return response()->json([
                'success' => false,
                'message' => 'Contact person tidak ditemukan'
            ], 404);
        }

        // 4. Validasi bahwa contact person ini milik company yang dimaksud
        if ($contactPerson->company_id != $companyId) {
            Log::warning('Payment does not belong to company:', [
                'payment_company_id' => $contactPerson->company_id,
                'requested_company_id' => $companyId
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak termasuk dalam company ini'
            ], 403);
        }

        // 5. Simpan amount payment sebelum dihapus
        $paymentAmount = $payment->amount;
        
        // 6. Soft delete payment
        $payment->update([
            'deleted' => 1,
            'deleted_by' => auth()->id(),
            'deleted_at' => now()
        ]);

        Log::info('Payment deleted successfully:', [
            'payment_id' => $paymentId,
            'amount' => $paymentAmount
        ]);

        // 7. Recalculate invoice amount_due
        $this->recalculateInvoiceAmountDue($payment->invoice_id);
        
        // 8. Commit transaction
        DB::commit();

        // 9. Return response
        return response()->json([
            'success' => true,
            'message' => 'Payment berhasil dihapus',
            'data' => [
                'id' => $paymentId,
                'deleted' => 1,
                'deleted_at' => now()->format('Y-m-d H:i:s')
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error deleting payment: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Gagal menghapus payment: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Bulk delete payments
     */
    public function bulkDeletePayments(Request $request, $companyId)
    {
        try {
            Log::info('=== BULK DELETE PAYMENTS REQUEST ===');
            Log::info('Company ID: ' . $companyId);
            Log::info('User ID: ' . auth()->id());
            Log::info('Request data:', $request->all());
            
            $validator = Validator::make($request->all(), [
                'payment_ids' => 'required|array',
                'payment_ids.*' => 'required|uuid'
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $paymentIds = $request->payment_ids;
            $deletedCount = 0;
            $failedIds = [];

            Log::info('Processing ' . count($paymentIds) . ' payments');

            foreach ($paymentIds as $paymentId) {
                try {
                    $payment = Payment::find($paymentId);
                    
                    if (!$payment) {
                        Log::warning('Payment not found in loop: ' . $paymentId);
                        $failedIds[] = ['id' => $paymentId, 'reason' => 'Payment not found'];
                        continue;
                    }

                    // Cek invoice untuk payment ini
                    $invoice = Invoice::find($payment->invoice_id);
                    if (!$invoice) {
                        Log::warning('Invoice not found for payment: ' . $paymentId);
                        $failedIds[] = ['id' => $paymentId, 'reason' => 'Invoice not found'];
                        continue;
                    }

                    // Cek contact person untuk invoice
                    $contactPerson = CompanyContactPerson::find($invoice->company_contact_persons_id);
                    if (!$contactPerson) {
                        Log::warning('Contact person not found for payment: ' . $paymentId);
                        $failedIds[] = ['id' => $paymentId, 'reason' => 'Contact person not found'];
                        continue;
                    }

                    // Validasi bahwa contact person ini milik company yang dimaksud
                    if ($contactPerson->company_id != $companyId) {
                        Log::warning('Payment does not belong to company:', [
                            'payment_id' => $paymentId,
                            'payment_company_id' => $contactPerson->company_id,
                            'requested_company_id' => $companyId
                        ]);
                        $failedIds[] = ['id' => $paymentId, 'reason' => 'Does not belong to company'];
                        continue;
                    }

                    // Soft delete payment
                    $payment->update([
                        'deleted' => 1,
                        'deleted_by' => auth()->id(),
                        'deleted_at' => now()
                    ]);
                    
                    $deletedCount++;
                    Log::info('Payment deleted: ' . $paymentId);

                } catch (\Exception $e) {
                    Log::error('Error processing payment ' . $paymentId . ': ' . $e->getMessage());
                    $failedIds[] = ['id' => $paymentId, 'reason' => $e->getMessage()];
                }
            }

            Log::info('Bulk delete completed:', [
                'requested' => count($paymentIds),
                'deleted' => $deletedCount,
                'failed' => count($failedIds)
            ]);

            return response()->json([
                'success' => true,
                'message' => "Berhasil menghapus {$deletedCount} payment(s)",
                'data' => [
                    'requested_count' => count($paymentIds),
                    'deleted_count' => $deletedCount,
                    'failed_count' => count($failedIds),
                    'failed_ids' => $failedIds
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in bulkDeletePayments: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus payments: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper function untuk mendapatkan invoices dari company
     */
    private function getCompanyInvoices(Company $company)
    {
        Log::info('=== GET COMPANY INVOICES ===');
        Log::info('Company ID: ' . $company->id);
        
        try {
            // Cari invoices melalui contact persons yang terkait dengan company
            $contactPersonIds = DB::table('company_contact_persons')
                ->where('company_id', $company->id)
                ->where('deleted', 0)
                ->pluck('id');
            
            Log::info('Contact person IDs found: ' . $contactPersonIds->count());
            
            if ($contactPersonIds->isEmpty()) {
                // Jika tidak ada via company_id, coba melalui lead_id
                if ($company->lead_id) {
                    $contactPersonIds = DB::table('company_contact_persons')
                        ->where('lead_id', $company->lead_id)
                        ->where('deleted', 0)
                        ->pluck('id');
                    
                    Log::info('Contact person IDs found via lead_id: ' . $contactPersonIds->count());
                }
                
                if ($contactPersonIds->isEmpty()) {
                    Log::info('No contact persons found for company');
                    return collect();
                }
            }
            
            // Ambil invoices berdasarkan contact person IDs
            $invoices = Invoice::with([
                    'contactPerson' => function($query) {
                        $query->select('id', 'name', 'email', 'phone', 'position');
                    },
                    'quotation' => function($query) {
                        $query->select('id', 'quotation_number', 'subject');
                    }
                ])
                ->whereIn('company_contact_persons_id', $contactPersonIds)
                ->where('deleted', 0)
                ->orderBy('date', 'desc')
                ->get();
            
            Log::info('Invoices found: ' . $invoices->count());
            
            return $invoices;
            
        } catch (\Exception $e) {
            Log::error('Error in getCompanyInvoices: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return collect();
        }
    }
    
    /**
     * Helper function untuk mendapatkan payments dari company
     */
    private function getCompanyPayments($company)
    {
        try {
            Log::info('Fetching payments for company ID: ' . $company->id);
            
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
                    $query->select('id', 'invoice_number', 'invoice_amout', 'date', 'status');
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
            
            return $payments;
            
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
     * Update project for a company
     */
    public function updateProject(Request $request, $companyId, $projectId)
    {
        try {
            Log::info('CompanyController: Updating project', [
                'company_id' => $companyId,
                'project_id' => $projectId,
                'data' => $request->all(),
                'user_id' => Auth::id()
            ]);

            // Validasi input
            $validator = Validator::make($request->all(), [
                'project_description' => 'required|string|max:1000',
                'start_date' => 'required|date',
                'deadline' => 'required|date|after_or_equal:start_date',
                'status' => 'required|string|in:pending,in_progress,completed,cancelled,delayed,progress,done,finished,new,draft,rejected,overdue,active,on_progress,canceled',
                'note' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for project update', [
                    'errors' => $validator->errors()->toArray(),
                    'project_id' => $projectId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Temukan company
            $company = Company::find($companyId);
            if (!$company) {
                Log::warning('Company not found', ['company_id' => $companyId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            // Temukan project berdasarkan projectId DAN client_id harus sama dengan companyId
            $project = Project::where('id', $projectId)
                ->where('client_id', $companyId) // Gunakan client_id untuk relasi
                ->where('deleted', 0)
                ->first();

            if (!$project) {
                Log::warning('Project not found or not belongs to company', [
                    'project_id' => $projectId,
                    'client_id' => $companyId,
                    'deleted' => 0
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Project not found or does not belong to this company'
                ], 404);
            }

            // Hitung days_left jika deadline diubah
            $isDeadlineChanged = $project->deadline != $validated['deadline'];
            $isStatusChanged = $project->status != $validated['status'];

            // Update project
            DB::beginTransaction();
            
            try {
                $updateData = [
                    'project_description' => $validated['project_description'],
                    'start_date' => $validated['start_date'],
                    'deadline' => $validated['deadline'],
                    'status' => $validated['status'],
                    'note' => $validated['note'] ?? null,
                    'updated_by' => Auth::id(),
                    'updated_at' => now()
                ];

                $project->update($updateData);

                // Hitung ulang days_left jika deadline berubah atau status berubah
                if ($isDeadlineChanged || $isStatusChanged) {
                    $this->calculateAndUpdateDaysLeft($project);
                }

                DB::commit();

                // Reload project dengan relasi
                $updatedProject = Project::with(['company', 'assignedUser', 'quotation'])
                    ->where('id', $projectId)
                    ->where('deleted', 0)
                    ->first();

                Log::info('Project updated successfully', [
                    'project_id' => $projectId,
                    'updated_data' => $updatedProject,
                    'calculated_days_left' => $updatedProject->days_left
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Project updated successfully!',
                    'project' => $updatedProject,
                    'calculated_days_left' => $updatedProject->days_left
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Transaction error updating project', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update project due to database error.',
                    'error' => config('app.debug') ? $e->getMessage() : null
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Error updating project in CompanyController', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'project_id' => $projectId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while updating the project.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Helper function to calculate and update days_left
     */
    private function calculateAndUpdateDaysLeft(Project $project)
    {
        try {
            // Status yang mengharuskan days_left = null
            $completedStatuses = ['completed', 'done', 'finished'];
            $cancelledStatuses = ['cancelled', 'canceled', 'rejected'];
            
            // Jika status sudah completed atau cancelled, set days_left ke null
            if (in_array($project->status, $completedStatuses) || in_array($project->status, $cancelledStatuses)) {
                $project->days_left = null;
                $project->save();
                
                Log::debug('Set days_left to null for completed/cancelled project', [
                    'project_id' => $project->id,
                    'status' => $project->status
                ]);
                return;
            }

            // Hitung days left
            $deadline = new \DateTime($project->deadline);
            $today = new \DateTime();
            $today->setTime(0, 0, 0);
            
            $interval = $today->diff($deadline);
            $daysLeft = (int) $interval->format('%r%a'); // %r gives sign (- for past, + for future)

            // Update days_left
            $project->days_left = $daysLeft;

            // Jika deadline sudah lewat dan status belum completed/cancelled, set status delayed
            $shouldBeDelayed = $daysLeft < 0 && 
                !in_array($project->status, array_merge($completedStatuses, $cancelledStatuses, ['delayed', 'overdue']));
            
            if ($shouldBeDelayed) {
                $project->status = 'delayed';
                Log::debug('Auto-updated status to delayed', [
                    'project_id' => $project->id,
                    'days_left' => $daysLeft,
                    'old_status' => $project->getOriginal('status'),
                    'new_status' => 'delayed'
                ]);
            }

            $project->save();

            Log::debug('Days left calculated and updated', [
                'project_id' => $project->id,
                'days_left' => $daysLeft,
                'status' => $project->status,
                'deadline' => $project->deadline,
                'today' => $today->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            Log::error('Error calculating days left', [
                'error' => $e->getMessage(),
                'project_id' => $project->id
            ]);
        }
    }

    /**
     * Delete project for a company
     */
    public function destroyProject($companyId, $projectId)
    {
        try {
            Log::info('CompanyController: Deleting project', [
                'company_id' => $companyId,
                'project_id' => $projectId,
                'user_id' => Auth::id()
            ]);

            // Temukan project yang dimiliki oleh company (gunakan client_id)
            $project = Project::where('id', $projectId)
                ->where('client_id', $companyId)
                ->where('deleted', 0)
                ->first();

            if (!$project) {
                Log::warning('Project not found for deletion', [
                    'company_id' => $companyId,
                    'project_id' => $projectId,
                    'deleted' => 0
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Project not found'
                ], 404);
            }

            DB::beginTransaction();
            
            try {
                // Soft delete (set deleted flag)
                $project->update([
                    'deleted' => 1,
                    'deleted_at' => now(),
                    'deleted_by' => Auth::id(),
                    'updated_by' => Auth::id()
                ]);

                DB::commit();

                Log::info('Project soft deleted successfully', [
                    'project_id' => $projectId,
                    'deleted_by' => Auth::id()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Project deleted successfully!',
                    'deleted_at' => $project->deleted_at
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error deleting project in CompanyController', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'project_id' => $projectId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete project. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get single project for editing
     */
    public function getProject($companyId, $projectId)
    {
        try {
            $project = Project::with(['company', 'assignedUser', 'quotation'])
                ->where('id', $projectId)
                ->where('client_id', $companyId)
                ->where('deleted', 0)
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'project' => $project
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching project', [
                'company_id' => $companyId,
                'project_id' => $projectId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Project not found'
            ], 404);
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