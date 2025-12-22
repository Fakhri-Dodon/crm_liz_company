<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\ClientType;
use App\Models\Lead;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CompanyController extends Controller
{
    // Show all companies with filters
    public function index(Request $request)
    {
        $query = Company::with(['clientType:id,name'])
            ->select([
                'companies.id',
                'companies.client_code',
                'companies.name',
                'companies.address',
                'companies.city',
                'companies.province',
                'companies.country',
                'companies.contact_person',
                'companies.position',
                'companies.email',
                'companies.phone',
                'companies.client_type_id',
                'companies.client_since',
                'companies.postal_code',
                'companies.vat_number',
                'companies.nib',
                'companies.website',
                'companies.is_active',
                'companies.created_at',
                'companies.updated_at'
            ]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('companies.name', 'like', "%{$search}%")
                  ->orWhere('companies.client_code', 'like', "%{$search}%")
                  ->orWhere('companies.email', 'like', "%{$search}%")
                  ->orWhere('companies.phone', 'like', "%{$search}%")
                  ->orWhere('companies.contact_person', 'like', "%{$search}%");
            });
        }

        // Type filter
        if ($request->filled('client_type_id')) {
            $query->where('client_type_id', $request->client_type_id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        // Sort
        $sortField = $request->get('sort', 'companies.created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Get companies with pagination
        $companies = $query->paginate(10)
            ->withQueryString()
            ->through(fn ($company) => [
                'id' => $company->id,
                'client_code' => $company->client_code,
                'name' => $company->name,
                'address' => $company->address,
                'city' => $company->city,
                'province' => $company->province,
                'country' => $company->country,
                'contact_person' => $company->contact_person,
                'position' => $company->position,
                'email' => $company->email,
                'phone' => $company->phone,
                'client_type_id' => $company->client_type_id,
                'client_type_name' => $company->clientType->name ?? 'N/A',
                'client_since' => $company->client_since ? $company->client_since->format('d M Y') : null,
                'postal_code' => $company->postal_code,
                'vat_number' => $company->vat_number,
                'nib' => $company->nib,
                'website' => $company->website,
                'is_active' => $company->is_active,
                'created_at' => $company->created_at->format('d M Y'),
                'updated_at' => $company->updated_at->format('d M Y'),
            ]);

        // Get all client types from database
        $clientTypes = ClientType::select('id', 'name', 'information')
            ->get()
            ->map(function ($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'label' => $type->information,
                    'count' => Company::where('client_type_id', $type->id)->count()
                ];
            });

        // Get statistics
        $statistics = [
            'total' => Company::count(),
            'active' => Company::where('is_active', true)->count(),
            'inactive' => Company::where('is_active', false)->count(),
            'client_types' => $clientTypes
        ];

        // Get client types for filter dropdown
        $typeOptions = ClientType::select('id', 'name')->get();

        $fromQuotation = $request->has('from_quotation');
        $quotationId = $request->get('quotation_id');
        
        return Inertia::render('Companies/Index', [
            'companies' => $companies,
            'statistics' => $statistics,
            'types' => $typeOptions,
            'filters' => $request->only(['search', 'client_type_id', 'status', 'sort', 'direction']),
            'fromQuotation' => $fromQuotation,
            'quotationId' => $quotationId,
        ]);
    }

    // Show create form
    public function create(Request $request)
    {
        $clientTypes = ClientType::select('id', 'name')->get();
        $leads = Lead::select('id', 'company_name')->whereDoesntHave('company')->get();
        
        // Get quotations with lead info
        $quotations = Quotation::with(['lead:id,company_name'])
            ->select('id', 'quotation_number', 'lead_id')
            ->whereDoesntHave('company')
            ->where('status', 'accepted')
            ->get()
            ->map(function ($quotation) {
                return [
                    'id' => $quotation->id,
                    'quotation_number' => $quotation->quotation_number,
                    'lead_id' => $quotation->lead_id,
                    'company_name' => $quotation->lead->company_name ?? 'No company name'
                ];
            });

        return Inertia::render('Companies/Create', [
            'clientTypes' => $clientTypes,
            'leads' => $leads,
            'quotations' => $quotations,
            'selectedQuotation' => $request->get('quotation_id')
        ]);
    }

    // Store new company
    public function store(Request $request)
    {
        // For AJAX/JSON requests
        if ($request->ajax() || $request->wantsJson()) {
            return $this->storeJson($request);
        }
        
        // For regular form submission
        return $this->storeWeb($request);
    }
    
    private function storeJson(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'client_type_id' => 'required|exists:client_type,id',
            'status' => 'required|in:active,inactive',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'nib' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email|unique:companies,email',
            'contact_phone' => 'required|string|max:20',
            'contact_position' => 'nullable|string|max:100',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'quotation_id' => 'nullable|exists:quotations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Handle logo upload
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('company-logos', 'public');
            }

            // Jika ada quotation_id, ambil lead_id dari quotation
            $leadId = null;
            $companyName = $request->company_name;
            
            if ($request->filled('quotation_id')) {
                $quotation = Quotation::find($request->quotation_id);
                if ($quotation && $quotation->lead_id) {
                    $leadId = $quotation->lead_id;
                    
                    if (empty($companyName)) {
                        $lead = Lead::find($leadId);
                        if ($lead) {
                            $companyName = $lead->company_name ?? $request->company_name;
                        }
                    }
                }
            }

            // Create company
            $company = Company::create([
                'id' => (string) Str::orderedUuid(),
                'client_code' => 'CL-' . strtoupper(uniqid()),
                'name' => $companyName,
                'client_type_id' => $request->client_type_id,
                'lead_id' => $leadId,
                'quotation_id' => $request->quotation_id,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_person' => $request->contact_person,
                'position' => $request->contact_position,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'client_since' => now(),
                'postal_code' => $request->postal_code,
                'vat_number' => $request->vat_number,
                'nib' => $request->nib,
                'website' => $request->website,
                'logo_path' => $logoPath,
                'is_active' => $request->status === 'active',
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully!',
                'data' => $company
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Company creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function storeWeb(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'client_type_id' => 'required|exists:client_type,id',
            'status' => 'required|in:active,inactive',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'nib' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email|unique:companies,email',
            'contact_phone' => 'required|string|max:20',
            'contact_position' => 'nullable|string|max:100',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'quotation_id' => 'nullable|exists:quotations,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();

            // Handle logo upload
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('company-logos', 'public');
            }

            // Jika ada quotation_id, ambil lead_id dari quotation
            $leadId = null;
            $companyName = $request->company_name;
            
            if ($request->filled('quotation_id')) {
                $quotation = Quotation::find($request->quotation_id);
                if ($quotation && $quotation->lead_id) {
                    $leadId = $quotation->lead_id;
                    
                    if (empty($companyName)) {
                        $lead = Lead::find($leadId);
                        if ($lead) {
                            $companyName = $lead->company_name ?? $request->company_name;
                        }
                    }
                }
            }

            // Create company
            $company = Company::create([
                'id' => (string) Str::orderedUuid(),
                'client_code' => 'CL-' . strtoupper(uniqid()),
                'name' => $companyName,
                'client_type_id' => $request->client_type_id,
                'lead_id' => $leadId,
                'quotation_id' => $request->quotation_id,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_person' => $request->contact_person,
                'position' => $request->contact_position,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'client_since' => now(),
                'postal_code' => $request->postal_code,
                'vat_number' => $request->vat_number,
                'nib' => $request->nib,
                'website' => $request->website,
                'logo_path' => $logoPath,
                'is_active' => $request->status === 'active',
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return redirect()->route('companies.index')
                ->with('success', 'Client created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to create client: ' . $e->getMessage())
                ->withInput();
        }
    }

    // Show single company
    public function show(Company $company)
    {
        $company->load(['clientType', 'lead', 'quotation', 'creator', 'updater']);

        return Inertia::render('Companies/Show', [
            'company' => [
                'id' => $company->id,
                'client_code' => $company->client_code,
                'name' => $company->name,
                'address' => $company->address,
                'city' => $company->city,
                'province' => $company->province,
                'country' => $company->country,
                'contact_person' => $company->contact_person,
                'position' => $company->position,
                'email' => $company->email,
                'phone' => $company->phone,
                'client_type' => $company->clientType->name ?? 'N/A',
                'client_type_id' => $company->client_type_id,
                'lead_id' => $company->lead_id,
                'lead_name' => $company->lead->name ?? 'N/A',
                'quotation_id' => $company->quotation_id,
                'quotation_number' => $company->quotation->quotation_number ?? 'N/A',
                'client_since' => $company->client_since ? $company->client_since->format('d M Y') : null,
                'postal_code' => $company->postal_code,
                'vat_number' => $company->vat_number,
                'nib' => $company->nib,
                'website' => $company->website,
                'logo_path' => $company->logo_path,
                'is_active' => $company->is_active,
                'created_by_name' => $company->creator->name ?? 'N/A',
                'updated_by_name' => $company->updater->name ?? 'N/A',
                'created_at' => $company->created_at->format('d M Y H:i'),
                'updated_at' => $company->updated_at->format('d M Y H:i'),
            ]
        ]);
    }

    // Show edit form
    public function edit(Company $company)
    {
        $company->load(['clientType', 'lead', 'quotation']);

        $clientTypes = ClientType::select('id', 'name')->get();
        $leads = Lead::select('id', 'name')->get();
        $quotations = Quotation::select('id', 'quotation_number')->get();

        return Inertia::render('Companies/Edit', [
            'company' => [
                'id' => $company->id,
                'client_type_id' => $company->client_type_id,
                'lead_id' => $company->lead_id,
                'quotation_id' => $company->quotation_id,
                'client_code' => $company->client_code,
                'name' => $company->name,
                'address' => $company->address,
                'city' => $company->city,
                'province' => $company->province,
                'country' => $company->country,
                'contact_person' => $company->contact_person,
                'position' => $company->position,
                'email' => $company->email,
                'phone' => $company->phone,
                'client_since' => $company->client_since ? $company->client_since->format('Y-m-d') : null,
                'postal_code' => $company->postal_code,
                'vat_number' => $company->vat_number,
                'nib' => $company->nib,
                'website' => $company->website,
                'is_active' => $company->is_active,
            ],
            'clientTypes' => $clientTypes,
            'leads' => $leads,
            'quotations' => $quotations
        ]);
    }

    // Update company
    public function update(Request $request, Company $company)
    {
        $validator = Validator::make($request->all(), [
            'client_type_id' => 'required|exists:client_type,id',
            'lead_id' => 'nullable|exists:leads,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'client_code' => 'nullable|string|max:50|unique:companies,client_code,' . $company->id,
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'contact_person' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'email' => 'required|email|unique:companies,email,' . $company->id,
            'phone' => 'required|string|max:20',
            'client_since' => 'nullable|date',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'nib' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();

            $company->update([
                'client_type_id' => $request->client_type_id,
                'lead_id' => $request->lead_id,
                'quotation_id' => $request->quotation_id,
                'client_code' => $request->client_code,
                'name' => $request->name,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_person' => $request->contact_person,
                'position' => $request->position,
                'email' => $request->email,
                'phone' => $request->phone,
                'client_since' => $request->client_since,
                'postal_code' => $request->postal_code,
                'vat_number' => $request->vat_number,
                'nib' => $request->nib,
                'website' => $request->website,
                'is_active' => $request->is_active,
                'updated_by' => auth()->id(),
            ]);

            DB::commit();

            return redirect()->route('companies.index')
                ->with('success', 'Company updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to update company: ' . $e->getMessage())
                ->withInput();
        }
    }

    // Delete company (soft delete)
    public function destroy(Company $company)
    {
        try {
            DB::beginTransaction();

            $company->update([
                'deleted' => true,
                'deleted_at' => now(),
                'deleted_by' => auth()->id()
            ]);

            DB::commit();

            return redirect()->route('companies.index')
                ->with('success', 'Company deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to delete company: ' . $e->getMessage());
        }
    }

    // Restore deleted company
    public function restore($id)
    {
        $company = Company::withTrashed()->findOrFail($id);

        try {
            DB::beginTransaction();

            $company->update([
                'deleted' => false,
                'deleted_at' => null,
                'deleted_by' => null
            ]);

            DB::commit();

            return redirect()->route('companies.index')
                ->with('success', 'Company restored successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to restore company: ' . $e->getMessage());
        }
    }

    // Toggle active status
    public function toggleStatus(Company $company)
    {
        try {
            DB::beginTransaction();

            $company->update([
                'is_active' => !$company->is_active
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully',
                'is_active' => $company->is_active
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status'
            ], 500);
        }
    }

    // Get companies for API/Select
    public function getCompanies(Request $request)
    {
        $query = Company::select('id', 'client_code', 'name', 'client_type_id')
            ->where('is_active', true)
            ->with(['clientType:id,name']);

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('client_code', 'like', "%{$request->search}%");
        }

        if ($request->filled('client_type_id')) {
            $query->where('client_type_id', $request->client_type_id);
        }

        $companies = $query->orderBy('name')->limit(50)->get();

        return response()->json($companies);
    }

    // Get leads for company creation
    public function getLeadsForCreation()
    {
        $leads = Lead::with(['quotations' => function ($query) {
            $query->select('id', 'quotation_number', 'lead_id', 'status')
                ->where('status', 'accepted')
                ->whereDoesntHave('company');
        }])
        ->select('id', 'company_name', 'email', 'phone')
        ->where(function ($query) {
            $query->whereHas('quotations', function ($q) {
                $q->where('status', 'accepted')
                ->whereDoesntHave('company');
            })
            ->orWhereDoesntHave('company');
        })
        ->orderBy('company_name')
        ->get()
        ->map(function ($lead) {
            return [
                'id' => $lead->id,
                'company_name' => $lead->company_name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'quotations' => $lead->quotations->map(function ($quotation) {
                    return [
                        'id' => $quotation->id,
                        'quotation_number' => $quotation->quotation_number,
                        'status' => $quotation->status
                    ];
                })
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $leads
        ]);
    }
}