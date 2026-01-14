<?php


namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Company;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\User;

class ProjectController extends Controller
{
public function index(Request $request)
{
    // Get summary statistics
    $summary = Project::select('status', DB::raw('count(*) as count'))
        ->where('deleted', 0)
        ->groupBy('status')
        ->get()
        ->pluck('count', 'status')
        ->toArray();

    // Prepare summary data dengan status yang sesuai screenshot
    $summaryData = [
        'in_progress' => $summary['in_progress'] ?? 0,
        'completed' => $summary['completed'] ?? 0,
        'pending' => $summary['pending'] ?? 0,
        'cancelled' => $summary['cancelled'] ?? 0,
        'total' => array_sum($summary)
    ];

    // Build query with filters
    $query = Project::with(['company:id,client_code,city', 'quotation:id,quotation_number'])
        ->where('deleted', 0);

    // Apply search filter
    if ($request->filled('search')) {
        $search = $request->input('search');
        $query->where(function ($q) use ($search) {
            $q->where('project_description', 'like', "%{$search}%")
              ->orWhere('note', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('client_code', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
              });
        });
    }

    // Apply status filter
    if ($request->filled('status') && $request->input('status') !== 'all') {
        $query->where('status', $request->input('status'));
    }

    // Apply month filter
    if ($request->filled('month')) {
        $query->whereMonth('start_date', $request->input('month'));
    }

    // Apply year filter
    if ($request->filled('year')) {
        $query->whereYear('start_date', $request->input('year'));
    }

    // Get paginated results
    $projects = Project::with([
            'company.lead:id,company_name', // Tambah eager load untuk lead
            'assignedUser', 
            'quotation.lead:id,company_name'
        ])
        ->where('deleted', 0)
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

    // Get filter options
    $years = Project::select(DB::raw('YEAR(start_date) as year'))
        ->where('deleted', 0)
        ->distinct()
        ->orderBy('year', 'desc')
        ->pluck('year')
        ->filter()
        ->values();

    // **DIUBAH: Get companies dengan company_name dari leads**
    $companies = Company::where('is_active', true)
        ->where('deleted', 0)
        ->whereNull('deleted_at')
        ->with(['lead:id,company_name']) // Tambahkan eager load untuk lead
        ->select('id', 'client_code', 'city', 'client_since', 'lead_id')
        ->orderBy('client_code')
        ->get()
        ->map(function ($company) {
            // Tentukan nama: utamakan company_name dari lead, fallback ke client_code
            $companyName = $company->lead?->company_name ?? $company->client_code;
            
            return [
                'id' => $company->id,
                'name' => $companyName, // Nama perusahaan dari leads
                'display_name' => $companyName . ($company->city ? ' - ' . $company->city : ''),
                'full_display' => $companyName . 
                                 ($company->city ? ' - ' . $company->city : '') . 
                                 ($company->client_code ? ' (' . $company->client_code . ')' : ''),
                'client_code' => $company->client_code,
                'city' => $company->city,
                'client_since' => $company->client_since,
                'lead_id' => $company->lead_id,
                'has_lead' => !is_null($company->lead_id)
            ];
        });

    $quotations = Quotation::with('lead:id,company_name') 
        ->where('deleted', 0)
        ->whereNull('deleted_at')
        ->select('id', 'quotation_number', 'date', 'lead_id')
        ->orderBy('quotation_number', 'desc')
        ->get()
        ->map(function ($quotation) {
            $companyName = $quotation->lead?->company_name ?? 'No Company';
            return [
                'id' => $quotation->id,
                'name' => $companyName, 
                'number' => "{$quotation->quotation_number} ({$quotation->date})",
                'display_name' => $companyName . " - {$quotation->quotation_number}"
            ];
        });

    // Get users for assignment
    $users = User::select('id', 'name', 'email')
        ->orderBy('name')
        ->get();

    return Inertia::render('Project/Index', [
        'projects' => $projects,
        'summary' => $summaryData,
        'filters' => $request->only(['search', 'status', 'month', 'year']),
        'years' => $years,
        'companies' => $companies,
        'quotations' => $quotations,
        'users' => $users,
        'statusOptions' => [
            ['value' => 'in_progress', 'label' => 'In Progress'],
            ['value' => 'completed', 'label' => 'Completed'],
            ['value' => 'pending', 'label' => 'Pending'],
            ['value' => 'cancelled', 'label' => 'Cancelled']
        ],
        'auth_permissions' => auth()->user()->getPermissions('PROJECT'),
    ]);
}

public function getClients()
{
    try {
        // Gunakan with untuk eager loading lead
        $clients = Company::where('companies.deleted', 0)
            ->where('companies.is_active', 1)
            ->with(['lead:id,company_name,contact_person,email']) // Eager load lead
            ->select('companies.id', 'companies.client_code', 'companies.city', 'companies.lead_id')
            ->orderByRaw('
                CASE 
                    WHEN lead_id IS NOT NULL THEN (
                        SELECT company_name FROM leads WHERE id = companies.lead_id
                    )
                    ELSE client_code 
                END ASC
            ')
            ->get()
            ->map(function($company) {
                // Tentukan nama untuk display - utamakan company_name dari lead
                $companyName = $company->lead?->company_name ?? $company->client_code;
                
                return [
                    'id' => $company->id,
                    'name' => $companyName, // Nama dari lead atau client_code
                    'display_name' => $companyName . 
                                     ($company->city ? ' - ' . $company->city : ''),
                    'full_display' => $companyName . 
                                     ($company->city ? ' - ' . $company->city : '') . 
                                     ($company->client_code ? ' (' . $company->client_code . ')' : ''),
                    'client_code' => $company->client_code,
                    'city' => $company->city,
                    'lead_id' => $company->lead_id,
                    'has_lead' => !is_null($company->lead_id),
                    'lead_company_name' => $company->lead?->company_name,
                    'contact_person' => $company->lead?->contact_person,
                    'email' => $company->lead?->email
                ];
            });

        \Log::info('Clients fetched successfully', [
            'total' => $clients->count(),
            'with_lead' => $clients->where('has_lead', true)->count(),
            'without_lead' => $clients->where('has_lead', false)->count(),
            'sample' => $clients->take(3)->map(function($client) {
                return [
                    'id' => $client['id'],
                    'name' => $client['name'],
                    'lead_company_name' => $client['lead_company_name'],
                    'client_code' => $client['client_code']
                ];
            })
        ]);

        return response()->json([
            'success' => true,
            'data' => $clients,
            'count' => $clients->count()
        ]);

    } catch (\Exception $e) {
        \Log::error('Error fetching clients: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch clients: ' . $e->getMessage()
        ], 500);
    }
}

public function store(Request $request)
{
    \Log::info('Project Store Request:', $request->all());
    
    // Validasi dengan company_id (alias untuk client_id)
    $validated = $request->validate([
        'quotation_id' => 'nullable|exists:quotations,id',
        'company_id' => 'required|exists:companies,id',
        'project_description' => 'required|string|max:250',
        'start_date' => 'required|date',
        'deadline' => 'required|date|after_or_equal:start_date',
        'note' => 'nullable|string|max:250',
        'status' => 'required|in:in_progress,completed,pending,cancelled'
    ]);

    try {
        $userId = Auth::id();
        $user = User::find($userId);
        
        if (!$user) {
            $userUuid = Str::uuid()->toString();
        } else {
            $userUuid = $user->id;
        }

        // **PERBAIKAN: Handle NULL quotation_id**
        $quotationId = $validated['quotation_id'] ?? null;
        
        // Jika quotation_id kosong string, ubah ke null
        if ($quotationId === '') {
            $quotationId = null;
        }

        // PERBAIKAN: Pastikan client_id terisi
        $projectData = [
            'id' => (string) Str::uuid(),
            'client_id' => $validated['company_id'], // Langsung isi client_id
            'quotation_id' => $quotationId, // **DIUBAH: Bisa null**
            'user_id' => $userUuid,
            'project_description' => $validated['project_description'],
            'start_date' => $validated['start_date'],
            'deadline' => $validated['deadline'],
            'note' => $validated['note'] ?? null,
            'status' => $validated['status'],
            'created_by' => $userUuid,
            'updated_by' => $userUuid,
            'deleted' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ];

        \Log::info('Project Store Data to be created:', $projectData);

        $project = Project::create($projectData);
        
        \Log::info('Project Created Successfully:', [
            'id' => $project->id,
            'project_description' => $project->project_description,
            'client_id' => $project->client_id,
            'quotation_id' => $project->quotation_id,
            'status' => $project->status
        ]);
        
        return redirect()->route('projects.index')
            ->with('success', 'Project created successfully!');
            
    } catch (\Exception $e) {
        \Log::error('Project Store Error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
        
        return back()
            ->withInput()
            ->withErrors(['error' => 'Failed to create project: ' . $e->getMessage()]);
    }
}

public function edit(Project $project)
{
    \Log::info('Fetching project for edit:', ['project_id' => $project->id]);
    
    // Cek jika project sudah dihapus
    if ($project->deleted == 1) {
        return response()->json([
            'error' => 'Cannot edit deleted project.'
        ], 404);
    }

    try {
        // Load project dengan relasi ke company dan lead
        $project->load(['company:id,client_code,city', 'company.lead:id,company_name', 'quotation:id,quotation_number,date']);
        
        \Log::info('Project loaded:', [
            'id' => $project->id,
            'client_id' => $project->client_id,
            'company' => $project->company ? $project->company->id : null,
            'quotation_id' => $project->quotation_id,
            'project_description' => $project->project_description,
            'start_date' => $project->start_date,
            'deadline' => $project->deadline,
            'status' => $project->status
        ]);

        // Format data untuk response
        $formattedProject = [
            'id' => $project->id,
            'quotation_id' => $project->quotation_id, // Bisa null
            'company_id' => $project->client_id,
            'project_description' => $project->project_description,
            'start_date' => $project->start_date ? $project->start_date->format('Y-m-d') : '',
            'deadline' => $project->deadline ? $project->deadline->format('Y-m-d') : '',
            'note' => $project->note ?? '',
            'status' => $project->status,
            'company' => $project->company ? [
                'id' => $project->company->id,
                'name' => $project->company->lead->company_name ?? $project->company->client_code, // Nama dari lead
                'client_code' => $project->company->client_code,
                'city' => $project->company->city
            ] : null,
            'quotation' => $project->quotation ? [
                'id' => $project->quotation->id,
                'name' => $project->quotation->quotation_number . ' (' . $project->quotation->date . ')'
            ] : null
        ];

        \Log::info('Formatted project response:', $formattedProject);

        return response()->json($formattedProject);
        
    } catch (\Exception $e) {
        \Log::error('Error in edit method:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Failed to fetch project data.'
        ], 500);
    }
}

public function update(Request $request, Project $project)
{
    if ($project->deleted == 1) {
        return redirect()->route('projects.index')
            ->with('error', 'Cannot update deleted project.');
    }

    $validated = $request->validate([
        'quotation_id' => 'nullable|exists:quotations,id',
        'company_id' => 'required|exists:companies,id',
        'project_description' => 'required|string|max:250',
        'start_date' => 'required|date',
        'deadline' => 'required|date|after_or_equal:start_date',
        'note' => 'nullable|string|max:250',
        'status' => 'required|in:in_progress,completed,pending,cancelled'
    ]);

    $userId = Auth::id();
    $user = User::find($userId);
    $userUuid = $user ? $user->id : Str::uuid()->toString();
    
    // **PERBAIKAN: Handle NULL quotation_id**
    $quotationId = $validated['quotation_id'] ?? null;
    
    // Jika quotation_id kosong string, ubah ke null
    if ($quotationId === '') {
        $quotationId = null;
    }
    
    // PERBAIKAN: Update dengan client_id
    $updateData = [
        'client_id' => $validated['company_id'], // Langsung pakai client_id
        'quotation_id' => $quotationId, // **DIUBAH: Bisa null**
        'project_description' => $validated['project_description'],
        'start_date' => $validated['start_date'],
        'deadline' => $validated['deadline'],
        'note' => $validated['note'] ?? null,
        'status' => $validated['status'],
        'updated_by' => $userUuid,
        'updated_at' => now()
    ];

    if ($project->client_id != $validated['company_id']) {
        \Log::info('Project company changed:', [
            'project_id' => $project->id,
            'old_company' => $project->client_id,
            'new_company' => $validated['company_id']
        ]);
    }

    $project->update($updateData);

    return redirect()->route('projects.index')
        ->with('success', 'Project updated successfully!');
}

    public function destroy(Project $project)
    {
        if ($project->deleted == 1) {
            return redirect()->route('projects.index')
                ->with('error', 'Project already deleted.');
        }

        $userId = Auth::id();
        $user = User::find($userId);
        $userUuid = $user ? $user->id : Str::uuid()->toString();
        
        $project->deleted_by = $userUuid;
        $project->deleted = 1;
        $project->deleted_at = now();
        $project->save();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully!');
    }

public function updateStatus(Request $request, Project $project)
{
    if ($project->deleted == 1) {
        // Return Inertia redirect dengan error
        return back()->with('error', 'Cannot update status of deleted project.');
    }

    $validated = $request->validate([
        'status' => 'required|in:in_progress,completed,pending,cancelled'
    ]);

    $userId = Auth::id();
    $user = User::find($userId);
    $userUuid = $user ? $user->id : Str::uuid()->toString();

    try {
        // Log sebelum update
        \Log::info('Updating project status:', [
            'project_id' => $project->id,
            'old_status' => $project->status,
            'new_status' => $validated['status']
        ]);

        // Update project status
        $project->update([
            'status' => $validated['status'],
            'updated_by' => $userUuid,
            'updated_at' => now()
        ]);

        // Log setelah update
        \Log::info('Project status updated successfully:', [
            'project_id' => $project->id,
            'status' => $project->status
        ]);

        // **PERBAIKAN: Kembalikan Inertia redirect atau response**
        if ($request->header('X-Inertia')) {
            // Untuk Inertia request, redirect back dengan success message
            return back()->with('success', 'Project status updated successfully!');
        } else {
            // Untuk API request (jika ada), tetap return JSON
            return response()->json([
                'success' => true,
                'message' => 'Project status updated successfully!',
                'data' => [
                    'id' => $project->id,
                    'status' => $project->status,
                    'status_label' => ucfirst(str_replace('_', ' ', $project->status))
                ]
            ]);
        }

    } catch (\Exception $e) {
        \Log::error('Failed to update project status: ' . $e->getMessage());
        
        if ($request->header('X-Inertia')) {
            return back()->with('error', 'Failed to update status: ' . $e->getMessage());
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status: ' . $e->getMessage()
            ], 500);
        }
    }
}


    // DIUBAH: Tambahan method untuk mendapatkan projects by company
    public function getProjectsByCompany($companyId)
    {
        $projects = Project::with(['quotation:id,quotation_number', 'assignedUser:id,name'])
            ->where('company_id', $companyId)
            ->where('deleted', 0)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'project_description' => $project->project_description,
                    'status' => $project->status,
                    'start_date' => $project->start_date,
                    'deadline' => $project->deadline,
                    'quotation_number' => $project->quotation ? $project->quotation->quotation_number : null,
                    'assigned_user' => $project->assignedUser ? $project->assignedUser->name : null
                ];
            });

        return response()->json([
            'projects' => $projects,
            'count' => $projects->count()
        ]);
    }

    // Backup/legacy method untuk kompatibilitas
    public function getProjectsByClient($clientId)
    {
        // DIUBAH: Jika ada kode yang masih memanggil dengan client_id, redirect ke company
        return $this->getProjectsByCompany($clientId);
    }
}