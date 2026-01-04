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
        $projects = $query->orderBy('created_at', 'desc')
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

        // Get companies for dropdown
        $companies = Company::where('is_active', true)
            ->where('deleted', 0)
            ->whereNull('deleted_at')
            ->select('id', 'client_code', 'city', 'client_since')
            ->orderBy('client_code')
            ->get()
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->client_code . ' - ' . $company->city,
                    'client_code' => $company->client_code,
                    'city' => $company->city,
                    'client_since' => $company->client_since
                ];
            });

        $quotations = Quotation::where('deleted', 0)
            ->whereNull('deleted_at')
            ->select('id', 'quotation_number', 'date')
            ->orderBy('quotation_number', 'desc')
            ->get()
            ->map(function ($quotation) {
                return [
                    'id' => $quotation->id,
                    'name' => $quotation->quotation_number . ' (' . $quotation->date . ')'
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
            ]
        ]);
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

        // PERBAIKAN: Pastikan client_id terisi
        $projectData = [
            'id' => (string) Str::uuid(),
            'client_id' => $validated['company_id'], // Langsung isi client_id
            'quotation_id' => $validated['quotation_id'] ?? null,
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
        // Load project dengan relasi
        $project->load(['company:id,client_code,city,client_since', 'quotation:id,quotation_number,date']);
        
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
            'quotation_id' => $project->quotation_id,
            'company_id' => $project->client_id, // INI YANG PENTING: client_id bukan company_id
            'project_description' => $project->project_description,
            'start_date' => $project->start_date ? $project->start_date->format('Y-m-d') : '',
            'deadline' => $project->deadline ? $project->deadline->format('Y-m-d') : '',
            'note' => $project->note ?? '',
            'status' => $project->status,
            'company' => $project->company ? [
                'id' => $project->company->id,
                'name' => $project->company->client_code . ' - ' . $project->company->city,
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
    
    // PERBAIKAN: Update dengan client_id
    $updateData = [
        'client_id' => $validated['company_id'], // Langsung pakai client_id
        'quotation_id' => $validated['quotation_id'] ?? null,
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
            return redirect()->route('projects.index')
                ->with('error', 'Cannot update status of deleted project.');
        }

        $validated = $request->validate([
            'status' => 'required|in:in_progress,completed,pending,cancelled' // Hanya 4 status
        ]);

        $userId = Auth::id();
        $user = User::find($userId);
        $userUuid = $user ? $user->id : Str::uuid()->toString();

        try {
            $project->update([
                'status' => $validated['status'],
                'updated_by' => $userUuid
            ]);

            return redirect()->route('projects.index')
                ->with('success', 'Project status updated successfully!');
                
        } catch (\Exception $e) {
            return redirect()->route('projects.index')
                ->with('error', 'Failed to update status: ' . $e->getMessage());
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