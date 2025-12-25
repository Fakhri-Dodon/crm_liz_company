<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Lead;
use App\Models\ClientType;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index(Request $request)
    {
        try {
            \Log::info('Companies index accessed');
            
            // Query companies dengan relasi
            $query = Company::with(['clientType'])
                ->orderBy('created_at', 'desc');

            // Apply search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('client_code', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('contact_person', 'like', "%{$search}%");
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
            $companies = $query->paginate(15)->withQueryString();

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
                        'count' => $type->companies_count
                    ];
                })
            ];

            // Get all client types for filter (gunakan scope active)
            $types = ClientType::all()->map(function($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'information' => $type->information,
                    'created_at' => $type->created_at,
                    'updated_at' => $type->updated_at
                ];
            });

            // Debug log
            \Log::info('Companies data:', [
                'total' => $companies->total(),
                'client_types_count' => $types->count(),
                'statistics' => $statistics
            ]);

            // Check if coming from quotation
            $fromQuotation = $request->has('from_quotation') && $request->from_quotation == 'true';
            $quotationId = $request->get('quotation_id');

            // Return Inertia response
            return Inertia::render('Companies/Index', [
                'companies' => $companies,
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
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load companies'
                ], 500);
            }
            
            return back()->with('error', 'Failed to load companies');
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
            
            // Debug log
            \Log::info('Create company form loaded:', [
                'client_types_count' => $clientTypes->count(),
                'quotation_id' => $quotationId
            ]);
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'client_types' => $clientTypes,
                        'quotation_id' => $quotationId
                    ]
                ]);
            }

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
        try {
            // Debug data yang diterima
            \Log::info('Store company request data:', $request->all());
            \Log::info('Client types in request:', ['client_type_id' => $request->client_type_id]);
            
            // Validasi: cek apakah client_type_id valid
            if ($request->client_type_id) {
                $clientTypeExists = ClientType::where('id', $request->client_type_id)
                    ->where('deleted', 0)
                    ->exists();
                
                if (!$clientTypeExists) {
                    \Log::error('Invalid client type:', ['client_type_id' => $request->client_type_id]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid client type selected',
                        'errors' => ['client_type_id' => ['Client type is invalid']]
                    ], 422);
                }
            }
            
            // Validation rules
            $validator = Validator::make($request->all(), [
                'company_name' => 'required|string|max:255',
                'client_type_id' => 'required|exists:client_type,id',
                'contact_person' => 'required|string|max:255',
                'contact_email' => 'required|email|unique:companies,email',
                'contact_phone' => 'required|string|max:20',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:100',
                'province' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'postal_code' => 'nullable|integer',
                'vat_number' => 'nullable|integer',
                'nib' => 'nullable|string|max:50',
                'website' => 'nullable|url|max:255',
                'contact_position' => 'nullable|string|max:100',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'status' => 'required|in:active,inactive',
                'quotation_id' => 'nullable|exists:quotations,id',
                'lead_id' => 'nullable|exists:leads,id'
            ], [
                'contact_email.unique' => 'Email sudah terdaftar di sistem. Silakan gunakan email lain.',
                'client_type_id.exists' => 'Tipe klien tidak valid.',
                'quotation_id.exists' => 'Quotation tidak ditemukan.',
                'lead_id.exists' => 'Lead tidak ditemukan.',
                'postal_code.integer' => 'Kode pos harus berupa angka.',
                'vat_number.integer' => 'VAT number harus berupa angka.'
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed:', $validator->errors()->toArray());
                
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                
                return back()->withErrors($validator)->withInput();
            }

            // Handle logo upload
            $logoPath = null;
            if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
                $logoPath = $request->file('logo')->store('companies/logos', 'public');
            }

            \Log::info('Creating company with data:', [
                'client_type_id' => $request->client_type_id,
                'lead_id' => $request->lead_id,
                'quotation_id' => $request->quotation_id
            ]);

            // Create company
            $company = Company::create([
                'id' => (string) Str::orderedUuid(),
                'client_type_id' => $request->client_type_id,
                'lead_id' => $request->lead_id ?: null,
                'quotation_id' => $request->quotation_id ?: null,
                'name' => $request->company_name,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_person' => $request->contact_person,
                'position' => $request->contact_position,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'postal_code' => $request->postal_code,
                'vat_number' => $request->vat_number,
                'nib' => $request->nib,
                'website' => $request->website,
                'logo_path' => $logoPath,
                'is_active' => $request->status === 'active',
                'client_since' => now(),
                'created_by' => auth()->check() ? auth()->id() : null,
                'deleted' => false
            ]);

            \Log::info('Company created:', [
                'id' => $company->id,
                'client_type_id' => $company->client_type_id,
                'lead_id' => $company->lead_id,
                'quotation_id' => $company->quotation_id
            ]);

            // If created from quotation, update quotation status
            if ($company->quotation_id) {
                $quotation = Quotation::find($company->quotation_id);
                if ($quotation) {
                    $quotation->update(['status' => 'converted_to_client']);
                    \Log::info('Quotation updated:', ['quotation_id' => $quotation->id, 'status' => 'converted_to_client']);
                }
            }

            // If created from lead, update lead status
            if ($company->lead_id) {
                $lead = Lead::find($company->lead_id);
                if ($lead) {
                    // Update lead status ke 'converted_to_company'
                    $lead->update([
                        'converted_to_company' => true,
                        'converted_at' => now(),
                        'company_id' => $company->id
                    ]);
                    \Log::info('Lead updated:', [
                        'lead_id' => $lead->id, 
                        'converted_to_company' => true,
                        'company_id' => $company->id
                    ]);
                }
            }

            $message = 'Client created successfully!';
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => $company->load(['clientType'])
                ], 201);
            }

            return redirect()->route('companies.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Error creating company: ' . $e->getMessage());
            \Log::error('Request data: ' . json_encode($request->all()));
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create client: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create client: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Get accepted quotations for company creation (AJAX endpoint).
     */
    public function getAcceptedQuotations()
    {
        try {
            \Log::info('Fetching accepted quotations for company creation');
            
            // Debug: Cek apakah model Quotation ada
            if (!class_exists(Quotation::class)) {
                \Log::error('Quotation model not found');
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Quotation model not available'
                ]);
            }
            
            // Debug: Cek apakah tabel quotations ada
            try {
                $tableExists = \Schema::hasTable('quotations');
                \Log::info('Quotations table exists: ' . ($tableExists ? 'Yes' : 'No'));
                
                if (!$tableExists) {
                    return response()->json([
                        'success' => true,
                        'data' => [],
                        'message' => 'Quotations table not found'
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Error checking quotations table: ' . $e->getMessage());
            }
            
            // Get quotations with status 'accepted' and their lead data
            // Gunakan try-catch untuk setiap bagian query
            $quotations = [];
            
            try {
                // Pertama, coba query sederhana dulu
                $baseQuery = Quotation::query();
                
                // Cek apakah kolom status ada
                if (\Schema::hasColumn('quotations', 'status')) {
                    $baseQuery->where('status', 'accepted');
                }
                
                // Cek apakah kolom deleted ada
                if (\Schema::hasColumn('quotations', 'deleted')) {
                    $baseQuery->where('deleted', 0);
                }
                
                // Load lead relationship jika ada
                if (\Schema::hasTable('leads') && \Schema::hasColumn('quotations', 'lead_id')) {
                    $baseQuery->with(['lead' => function($query) {
                        $query->select('id', 'company_name', 'contact_person', 'email', 'phone', 'address', 'city', 'province', 'country');
                    }]);
                }
                
                // Apply ordering
                if (\Schema::hasColumn('quotations', 'accepted_at')) {
                    $baseQuery->orderBy('accepted_at', 'desc');
                }
                
                if (\Schema::hasColumn('quotations', 'created_at')) {
                    $baseQuery->orderBy('created_at', 'desc');
                }
                
                // Limit results
                $quotations = $baseQuery
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
                        return [
                            'id' => $quotation->id,
                            'quotation_number' => $quotation->quotation_number,
                            'subject' => $quotation->subject,
                            'status' => $quotation->status,
                            'accepted_at' => $quotation->accepted_at,
                            'total' => $quotation->total,
                            'created_at' => $quotation->created_at,
                            'lead' => $quotation->lead ? [
                                'id' => $quotation->lead->id,
                                'company_name' => $quotation->lead->company_name,
                                'contact_person' => $quotation->lead->contact_person,
                                'email' => $quotation->lead->email,
                                'phone' => $quotation->lead->phone,
                                'address' => $quotation->lead->address,
                                'city' => $quotation->lead->city,
                                'province' => $quotation->lead->province,
                                'country' => $quotation->lead->country,
                            ] : null
                        ];
                    })
                    ->toArray();
                    
                \Log::info('Found ' . count($quotations) . ' accepted quotations');
                
            } catch (\Exception $e) {
                \Log::error('Error executing quotation query: ' . $e->getMessage());
                \Log::error('Stack trace: ' . $e->getTraceAsString());
                
                // Return empty array jika ada error
                $quotations = [];
            }

            return response()->json([
                'success' => true,
                'data' => $quotations,
                'count' => count($quotations)
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
            
            // Validasi ID
            if (!$quotationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation ID is required'
                ], 400);
            }
            
            // Get the quotation
            $quotation = Quotation::with(['lead'])
                ->where('id', $quotationId)
                ->first();

            if (!$quotation) {
                \Log::warning('Quotation not found: ' . $quotationId);
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found'
                ], 404);
            }

            // Cek status jika kolom status ada
            if (\Schema::hasColumn('quotations', 'status') && $quotation->status !== 'accepted') {
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

            // Cek apakah lead ini sudah di-convert ke company (jika kolom ada)
            if (\Schema::hasColumn('leads', 'converted_to_company') && $quotation->lead->converted_to_company) {
                \Log::warning('Lead already converted to company: ' . $quotation->lead->id);
                return response()->json([
                    'success' => false,
                    'message' => 'This lead has already been converted to a company'
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
     * Update the specified company.
     */
    public function update(Request $request, $id)
    {
        try {
            $company = Company::findOrFail($id);

            // Validation rules
            $validator = Validator::make($request->all(), [
                'company_name' => 'required|string|max:255',
                'client_type_id' => 'required|exists:client_type,id',
                'contact_person' => 'required|string|max:255',
                'contact_email' => 'required|email|unique:companies,email,' . $id,
                'contact_phone' => 'required|string|max:20',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:100',
                'province' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'postal_code' => 'nullable|integer',
                'vat_number' => 'nullable|integer',
                'nib' => 'nullable|string|max:50',
                'website' => 'nullable|url|max:255',
                'contact_position' => 'nullable|string|max:100',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'status' => 'required|in:active,inactive'
            ], [
                'contact_email.unique' => 'Email sudah terdaftar di sistem. Silakan gunakan email lain.',
                'client_type_id.exists' => 'Tipe klien tidak valid.',
                'postal_code.integer' => 'Kode pos harus berupa angka.',
                'vat_number.integer' => 'VAT number harus berupa angka.'
            ]);

            if ($validator->fails()) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                
                return back()->withErrors($validator)->withInput();
            }

            // Handle logo upload
            if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
                // Delete old logo if exists
                if ($company->logo_path) {
                    Storage::disk('public')->delete($company->logo_path);
                }
                $logoPath = $request->file('logo')->store('companies/logos', 'public');
                $company->logo_path = $logoPath;
            }

            // Update company
            $company->update([
                'client_type_id' => $request->client_type_id,
                'name' => $request->company_name,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'postal_code' => $request->postal_code,
                'vat_number' => $request->vat_number,
                'nib' => $request->nib,
                'website' => $request->website,
                'contact_person' => $request->contact_person,
                'position' => $request->contact_position,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'is_active' => $request->status === 'active',
                'updated_by' => auth()->check() ? auth()->id() : null,
                'updated_at' => now()
            ]);

            $message = 'Client updated successfully!';
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => $company->fresh(['clientType'])
                ]);
            }

            return redirect()->route('companies.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Error updating company ' . $id . ': ' . $e->getMessage());
            \Log::error('Request data: ' . json_encode($request->all()));
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update client: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update client: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Remove the specified company (soft delete).
     */
    public function destroy($id)
    {
        try {
            $company = Company::findOrFail($id);
            
            // Soft delete
            $company->update([
                'deleted' => true,
                'deleted_at' => now(),
                'deleted_by' => auth()->check() ? auth()->id() : null
            ]);

            $message = 'Client deleted successfully.';
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message
                ]);
            }

            return redirect()->route('companies.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Error deleting company ' . $id . ': ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete client: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete client: ' . $e->getMessage());
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
                throw new \Exception('Company not found');
            }
            
            $company->update([
                'deleted' => false,
                'deleted_at' => null,
                'deleted_by' => null
            ]);

            $message = 'Client restored successfully.';
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => $company->fresh()
                ]);
            }

            return redirect()->route('companies.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Error restoring company ' . $id . ': ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to restore client: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to restore client: ' . $e->getMessage());
        }
    }
}