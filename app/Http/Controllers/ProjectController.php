<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ClientType;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\User; // TAMBAHKAN

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

        // Prepare summary data with default values
        $summaryData = [
            'in_progress' => $summary['in_progress'] ?? 0,
            'completed' => $summary['completed'] ?? 0,
            'pending' => $summary['pending'] ?? 0,
            'cancelled' => $summary['cancelled'] ?? 0,
            'total' => array_sum($summary)
        ];

        // Build query with filters
        $query = Project::with(['client:id,name', 'quotation:id,quotation_number'])
            ->where('deleted', 0);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('project_description', 'like', "%{$search}%")
                  ->orWhere('note', 'like', "%{$search}%")
                  ->orWhereHas('client', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
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

        // Get client types and quotations for dropdowns
        $clients = ClientType::where('deleted', 0)
            ->whereNull('deleted_at')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $quotations = Quotation::where('deleted', 0)
            ->whereNull('deleted_at')
            ->select('id', 'quotation_number')
            ->orderBy('quotation_number', 'desc')
            ->get();

        return Inertia::render('Project/Index', [
            'projects' => $projects,
            'summary' => $summaryData,
            'filters' => $request->only(['search', 'status', 'month', 'year']),
            'years' => $years,
            'clients' => $clients,
            'quotations' => $quotations,
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
        // Debug: log request
        \Log::info('Project Store Request:', $request->all());
        
        $validated = $request->validate([
            'quotation_id' => 'nullable|exists:quotations,id',
            'client_id' => 'required|exists:client_type,id',
            'project_description' => 'required|string|max:250',
            'start_date' => 'required|date',
            'deadline' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:250',
            'status' => 'required|in:in_progress,completed,pending,cancelled'
        ]);

        // **PERBAIKAN PENTING: Sesuaikan tipe data dengan database**
        $userId = Auth::id();
        $user = User::find($userId);
        
        // Jika user tidak ditemukan, gunakan default UUID
        if (!$user || empty($user->uuid)) {
            // Asumsi user table punya kolom 'uuid' atau 'id' sebagai UUID
            $userUuid = $user->uuid ?? Str::uuid()->toString();
        } else {
            $userUuid = $user->uuid;
        }

        $validated['id'] = (string) Str::uuid();
        
        // **PERBAIKAN: user_id harus char(36) bukan integer**
        $validated['user_id'] = $userUuid; // atau $user->id jika id user adalah UUID
        
        // **PERBAIKAN: created_by harus char(36)**
        $validated['created_by'] = $userUuid;
        
        // **PERBAIKAN: updated_by harus char(36)**
        $validated['updated_by'] = $userUuid;
        
        $validated['deleted'] = 0;
        
        // **PERBAIKAN: quotation_id bisa NULL di database, tapi di controller tidak nullable**
        if (empty($validated['quotation_id'])) {
            $validated['quotation_id'] = null;
        }

        \Log::info('Project Store Final Data:', $validated);

        try {
            $project = Project::create($validated);
            
            \Log::info('Project Created Successfully:', [
                'id' => $project->id,
                'project_description' => $project->project_description
            ]);
            
            // **OPTION 1: Redirect dengan flash message (biasa)**
            return redirect()->route('projects.index')
                ->with('success', 'Project created successfully!');
                
            // **OPTION 2: Untuk Inertia, bisa pakai ini:**
            // return back()->with('success', 'Project created successfully!');
            
        } catch (\Exception $e) {
            \Log::error('Project Store Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create project: ' . $e->getMessage()]);
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
            'client_id' => 'required|exists:client_type,id',
            'project_description' => 'required|string|max:250',
            'start_date' => 'required|date',
            'deadline' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:250',
            'status' => 'required|in:in_progress,completed,pending,cancelled'
        ]);

        // **PERBAIKAN: updated_by harus char(36)**
        $userId = Auth::id();
        $user = User::find($userId);
        $userUuid = $user->uuid ?? Str::uuid()->toString();
        
        $validated['updated_by'] = $userUuid;
        
        // **PERBAIKAN: quotation_id bisa NULL**
        if (empty($validated['quotation_id'])) {
            $validated['quotation_id'] = null;
        }

        $project->update($validated);

        return redirect()->route('projects.index')
            ->with('success', 'Project updated successfully!');
    }

    public function destroy(Project $project)
    {
        if ($project->deleted == 1) {
            return redirect()->route('projects.index')
                ->with('error', 'Project already deleted.');
        }

        // **PERBAIKAN: deleted_by harus char(36)**
        $userId = Auth::id();
        $user = User::find($userId);
        $userUuid = $user->uuid ?? Str::uuid()->toString();
        
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
            'status' => 'required|in:in_progress,completed,pending,cancelled'
        ]);

        // PERBAIKAN: updated_by harus char(36)
        $userId = Auth::id();
        $user = User::find($userId);
        $userUuid = $user->uuid ?? Str::uuid()->toString();

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
}