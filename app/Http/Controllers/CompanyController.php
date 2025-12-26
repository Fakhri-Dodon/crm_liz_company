<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Lead;
use App\Models\ClientType;
use App\Models\Quotation;
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
        
        // **VALIDASI HANYA UNTUK FIELD YANG DIPERLUKAN**
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'client_type_id' => 'required|exists:client_type,id',
            'contact_person' => 'nullable|string|max:255', // Karena tidak ada di table
            'contact_email' => 'nullable|email', // Karena tidak ada di table
            'contact_phone' => 'nullable|string|max:20', // Karena tidak ada di table
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'nib' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'contact_position' => 'nullable|string|max:100', // Karena tidak ada di table
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status' => 'required|in:active,inactive',
            'quotation_id' => 'nullable|exists:quotations,id',
            'lead_id' => 'nullable|exists:leads,id'
        ], [
            'client_type_id.exists' => 'Tipe klien tidak valid.',
            'quotation_id.exists' => 'Quotation tidak ditemukan.',
            'lead_id.exists' => 'Lead tidak ditemukan.',
            'postal_code.integer' => 'Kode pos harus berupa angka.',
            'vat_number.integer' => 'VAT number harus berupa angka.'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // **JIKA ADA QUOTATION_ID, CEK SAJA TANPA UPDATE LEAD**
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
                    'message' => 'Quotation not found or not accepted'
                ], 404);
            }

            // Check if already has company
            if ($quotation->company) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company already exists for this quotation'
                ], 400);
            }

            $quotationData = $quotation;
            $leadId = $quotation->lead_id;
            
            \Log::info('Creating company from quotation:', [
                'quotation_id' => $quotation->id,
                'lead_id' => $leadId
            ]);
        }

        // Handle logo upload
        $logoPath = null;
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $logoPath = $request->file('logo')->store('companies/logos', 'public');
        }

        // **SIMPAN HANYA DATA YANG ADA KOLOMNYA DI TABLE**
        $companyData = [
            'client_type_id' => $request->client_type_id,
            'lead_id' => $leadId,
            'quotation_id' => $request->quotation_id,
            'client_code' => $request->company_name, // Simpan nama perusahaan di sini
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
            // **TIDAK MASUKKAN: name, email, contact_person, position, address, phone**
        ];

        $company = Company::create($companyData);

        \Log::info('Company created successfully:', [
            'id' => $company->id,
            'client_code' => $company->client_code,
            'client_type_id' => $company->client_type_id,
            'lead_id' => $company->lead_id,
            'quotation_id' => $company->quotation_id
        ]);

        // **UPDATE QUOTATION NOTE SAJA, TANPA UPDATE LEAD**
        if ($request->quotation_id && $quotationData) {
            $quotationData->update([
                'note' => ($quotationData->note ?? '') . "\n\n[Converted to Company: " . $company->client_code . " on " . now()->format('Y-m-d H:i:s') . "]",
                'updated_at' => now()
            ]);
            \Log::info('Quotation updated with conversion note:', ['quotation_id' => $quotationData->id]);
        }

        DB::commit();

        // Load relationships untuk response
        $company->load(['clientType', 'lead', 'quotation']);

        return response()->json([
            'success' => true,
            'message' => 'Client created successfully!',
            'data' => [
                'id' => $company->id,
                'client_code' => $company->client_code,
                'name' => $company->client_code, // Nama dari client_code
                'city' => $company->city,
                'province' => $company->province,
                'country' => $company->country,
                'client_type' => $company->clientType ? $company->clientType->name : null,
                // Data kontak bisa diambil dari lead jika ada
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
            'message' => 'Failed to create client: ' . $e->getMessage()
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

            if ($quotation->lead->converted_to_company) {
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

public function update(Request $request, $id)
{
    DB::beginTransaction();
    try {
        \Log::info('=== UPDATE COMPANY REQUEST ===');
        \Log::info('Company ID: ' . $id);
        \Log::info('Request data received');
        
        $company = Company::findOrFail($id);

        // **PERBAIKAN**: Log data satu per satu untuk menghindari error
        $logData = [
            'company_name' => $request->company_name,
            'client_type_id' => $request->client_type_id,
            'status' => $request->status,
            'city' => $request->city,
            'province' => $request->province,
            'country' => $request->country,
            'postal_code' => $request->postal_code,
            'vat_number' => $request->vat_number,
            'nib' => $request->nib,
            'website' => $request->website,
            'has_logo' => $request->hasFile('logo'),
            'delete_logo' => $request->has('delete_logo') ? $request->delete_logo : false
        ];
        
        \Log::info('Request fields: ', $logData);

        // **PERBAIKAN**: Validasi harus sama dengan store() method
        $validator = Validator::make($request->all(), [
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
            'status' => 'required|in:active,inactive'
        ], [
            'client_type_id.exists' => 'Tipe klien tidak valid.',
            'postal_code.integer' => 'Kode pos harus berupa angka.',
            'vat_number.integer' => 'VAT number harus berupa angka.',
            'website.url' => 'Format website tidak valid.'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed: ' . json_encode($validator->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
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

        // Update company - HANYA kolom yang ada di database
        $updateData = [
            'client_type_id' => $request->client_type_id,
            'client_code' => $request->company_name, // Update nama di client_code
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

        \Log::info('Company updated successfully: ', [
            'id' => $company->id,
            'client_code' => $company->client_code,
            'client_type_id' => $company->client_type_id,
            'status' => $request->status
        ]);

        DB::commit();

        // Load fresh data with relationships
        $company->load(['clientType']);

        $message = 'Client updated successfully!';
        
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $company
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error updating company ' . $id . ': ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to update client: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Remove the specified company (soft delete).
     */
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
                'message' => 'Client has already been deleted'
            ], 400);
        }
        
        // Soft delete
        $company->update([
            'deleted' => true,
            'deleted_at' => now(),
            'deleted_by' => auth()->check() ? auth()->id() : null
        ]);

        \Log::info('Company soft deleted: ' . $company->id);

        DB::commit();

        $message = 'Client moved to trash successfully.';
        
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
            'message' => 'Failed to delete client: ' . $e->getMessage()
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
                'message' => 'Company not found'
            ], 404);
        }
        
        // Delete logo file if exists
        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }
        
        // Force delete from database
        $companyId = $company->id;
        $companyCode = $company->client_code;
        $company->forceDelete();

        \Log::info('Company permanently deleted: ' . $companyId);

        DB::commit();

        $message = 'Client permanently deleted.';
        
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
            'message' => 'Failed to permanently delete client: ' . $e->getMessage()
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
                'message' => 'No companies selected for deletion'
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
                        $deletedCount++;
                    }
                }
            } catch (\Exception $e) {
                $errors[] = "ID {$id}: " . $e->getMessage();
                \Log::error("Error deleting company {$id}: " . $e->getMessage());
            }
        }
        
        DB::commit();

        $message = $deletedCount . ' client' . ($deletedCount !== 1 ? 's' : '') . 
                  ' ' . ($request->permanent ? 'permanently deleted' : 'moved to trash') . '.';
        
        if (!empty($errors)) {
            $message .= ' Some errors occurred: ' . implode('; ', $errors);
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
            'message' => 'Failed to delete companies: ' . $e->getMessage()
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