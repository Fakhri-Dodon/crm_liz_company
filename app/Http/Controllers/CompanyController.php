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
                        'label' => $type->information,
                        'count' => $type->companies_count
                    ];
                })
            ];

            // Get all client types for filter
            $types = ClientType::all();

            // Check if coming from quotation
            $fromQuotation = $request->has('from_quotation') && $request->from_quotation == 'true';
            $quotationId = $request->get('quotation_id');

            // Return Inertia response (always for web requests)
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
            
            // Hanya return JSON jika benar-benar request AJAX
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
            $clientTypes = ClientType::all();
            $quotationId = $request->get('quotation_id');
            
            // Hanya return JSON jika benar-benar request AJAX untuk modal
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
            \Log::info('Lead ID from request:', ['lead_id' => $request->lead_id]);
            \Log::info('Quotation ID from request:', ['quotation_id' => $request->quotation_id]);
            
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

            // Generate client code
            $clientCode = 'CL-' . strtoupper(uniqid());

            \Log::info('Creating company with data:', [
                'lead_id' => $request->lead_id,
                'quotation_id' => $request->quotation_id,
                'client_code' => $clientCode
            ]);

            // Create company
            $company = Company::create([
                'id' => (string) Str::orderedUuid(),
                'client_type_id' => $request->client_type_id,
                'lead_id' => $request->lead_id ?: null, // Pastikan null jika kosong
                'quotation_id' => $request->quotation_id ?: null, // Pastikan null jika kosong
                'client_code' => $clientCode,
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
                    $lead->update(['status' => 'converted']);
                    \Log::info('Lead updated:', ['lead_id' => $lead->id, 'status' => 'converted']);
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
     * Display the specified company.
     */
    public function show($id)
    {
        try {
            $company = Company::with([
                'clientType', 
                'lead', 
                'quotation',
                'creator'
            ])->findOrFail($id);

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $company
                ]);
            }

            return Inertia::render('Companies/Show', [
                'company' => $company
            ]);
        } catch (\Exception $e) {
            \Log::error('Error showing company ' . $id . ': ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }
            
            return redirect()->route('companies.index')->with('error', 'Client not found');
        }
    }

    /**
     * Show the form for editing the specified company.
     */
    public function edit($id)
    {
        try {
            $company = Company::with(['clientType'])->findOrFail($id);
            $clientTypes = ClientType::all();

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'company' => $company,
                        'client_types' => $clientTypes
                    ]
                ]);
            }

            return Inertia::render('Companies/Edit', [
                'company' => $company,
                'client_types' => $clientTypes
            ]);
        } catch (\Exception $e) {
            \Log::error('Error editing company ' . $id . ': ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }
            
            return redirect()->route('companies.index')->with('error', 'Client not found');
        }
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, $id)
    {
        try {
            $company = Company::findOrFail($id);

            // Validation rules - disesuaikan
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

            // Update company sesuai struktur database
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
            
            // Soft delete sesuai struktur database
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
     * Force delete (permanent delete).
     */
    public function forceDelete($id)
    {
        try {
            // Gunakan withTrashed untuk mendapatkan data yang sudah di-soft delete
            $company = Company::where('id', $id)->first();
            
            if (!$company) {
                throw new \Exception('Company not found');
            }
            
            // Delete logo if exists
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }
            
            // Permanent delete
            $company->delete();

            $message = 'Client permanently deleted.';
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message
                ]);
            }

            return redirect()->route('companies.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Error force deleting company ' . $id . ': ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to permanently delete client: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to permanently delete client: ' . $e->getMessage());
        }
    }

    /**
     * Get leads for company creation (AJAX endpoint).
     * Ini khusus untuk AJAX requests dari modal
     */
    public function getLeadsForCreation()
    {
        try {
            // Get leads that don't have a company yet
            $leads = Lead::whereDoesntHave('company')
                ->where(function($query) {
                    $query->where('status', '!=', 'converted')
                          ->orWhereNull('status');
                })
                ->select('id', 'company_name', 'contact_person', 'email', 'phone')
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $leads
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching leads: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch leads'
            ], 500);
        }
    }

    /**
     * Get statistics for dashboard.
     * Ini khusus untuk AJAX requests
     */
    public function getStatistics()
    {
        try {
            $totalClients = Company::count();
            $activeClients = Company::where('is_active', true)->count();
            $inactiveClients = Company::where('is_active', false)->count();
            
            $clientTypes = ClientType::withCount(['companies' => function($query) {
                $query->where('deleted', 0);
            }])->get();

            $statistics = [
                'total' => $totalClients,
                'active' => $activeClients,
                'inactive' => $inactiveClients,
                'client_types' => $clientTypes->map(function($type) {
                    return [
                        'id' => $type->id,
                        'name' => $type->name,
                        'count' => $type->companies_count
                    ];
                })
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching statistics: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Restore soft deleted company.
     */
    public function restore($id)
    {
        try {
            $company = Company::where('id', $id)->first();
            
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