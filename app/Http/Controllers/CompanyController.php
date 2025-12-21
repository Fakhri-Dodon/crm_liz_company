<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\ClientType;
use App\Models\Lead;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CompanyController extends Controller
{
    // Show all companies with filters
// app/Http/Controllers/CompanyController.php (Update index method)
public function index(Request $request)
{
    $query = Company::with(['clientType:id,name'])
        ->select([
            'companies.id',
            'companies.client_code',
            'companies.name',
            'companies.address',
            'companies.contact_person',
            'companies.position',
            'companies.email',
            'companies.phone',
            'companies.client_type_id',
            'companies.client_since',
            'companies.vat_number',
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
            'contact_person' => $company->contact_person,
            'position' => $company->position,
            'email' => $company->email,
            'phone' => $company->phone,
            'client_type_id' => $company->client_type_id,
            'client_type_name' => $company->clientType->name ?? 'N/A',
            'client_since' => $company->client_since ? $company->client_since->format('d M Y') : null,
            'vat_number' => $company->vat_number,
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
                'label' => $type->information, // Gunakan 'information' dari database sebagai label
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

    return Inertia::render('Companies/Index', [
        'companies' => $companies,
        'statistics' => $statistics,
        'types' => $typeOptions,
        'filters' => $request->only(['search', 'client_type_id', 'status', 'sort', 'direction']),
    ]);
}

    // Show create form
    public function create()
    {
        $clientTypes = ClientType::select('id', 'name')->get();
        $leads = Lead::select('id', 'name')->whereDoesntHave('company')->get();
        $quotations = Quotation::select('id', 'quotation_number')->whereDoesntHave('company')->get();

        return Inertia::render('Companies/Create', [
            'clientTypes' => $clientTypes,
            'leads' => $leads,
            'quotations' => $quotations
        ]);
    }

    // Store new company
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_type_id' => 'required|exists:client_type,id',
            'lead_id' => 'nullable|exists:leads,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'client_code' => 'nullable|string|max:50|unique:companies,client_code',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'email' => 'required|email|unique:companies,email',
            'phone' => 'required|string|max:20',
            'client_since' => 'nullable|date',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();

            $company = Company::create($request->all());

            DB::commit();

            return redirect()->route('companies.index')
                ->with('success', 'Company created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to create company: ' . $e->getMessage())
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
                'vat_number_formatted' => $company->vat_number_formatted,
                'is_active' => $company->is_active,
                'status' => $company->status,
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
                'contact_person' => $company->contact_person,
                'position' => $company->position,
                'email' => $company->email,
                'phone' => $company->phone,
                'client_since' => $company->client_since ? $company->client_since->format('Y-m-d') : null,
                'postal_code' => $company->postal_code,
                'vat_number' => $company->vat_number,
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
            'contact_person' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'email' => 'required|email|unique:companies,email,' . $company->id,
            'phone' => 'required|string|max:20',
            'client_since' => 'nullable|date',
            'postal_code' => 'nullable|integer',
            'vat_number' => 'nullable|integer',
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();

            $company->update($request->all());

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
}