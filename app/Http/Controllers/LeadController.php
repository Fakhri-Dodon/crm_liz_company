<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Lead;
use App\Models\LeadStatuses;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class LeadController extends Controller
{
    /**
     * Get current logged in user ID
     */
    private function getCurrentUserId()
    {
        try {
            return Auth::id();
        } catch (\Exception $e) {
            Log::error('Failed to get current user ID: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get current logged in user data
     */
    private function getCurrentUser()
    {
        try {
            return Auth::user();
        } catch (\Exception $e) {
            Log::error('Failed to get current user: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Display leads page (Inertia) - SIMPLE VERSION
     */
    public function index()
    {
        try {
            $currentUser = Auth::user()->load('role');

            // Gunakan scope applyAccessControl yang baru dibuat
            // Eager Load 'status' dan 'assignedUser' untuk performa maksimal
            $leads = Lead::with(['status', 'assignedUser'])
                ->applyAccessControl($currentUser)
                ->whereNull('deleted_at')
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($lead) {
                    return [
                        'id'               => $lead->id,
                        'company_name'     => $lead->company_name,
                        'address'          => $lead->address,
                        'contact_person'   => $lead->contact_person,
                        'email'            => $lead->email,
                        'phone'            => $lead->phone,
                        'assigned_to'      => $lead->assigned_to,
                        'assigned_user'    => $lead->assignedUser ? [
                            'id'    => $lead->assignedUser->id,
                            'name'  => $lead->assignedUser->name,
                            'email' => $lead->assignedUser->email,
                        ] : null,
                        'lead_statuses_id' => $lead->lead_statuses_id,
                        'status_name'      => $lead->status_name ?? 'New',
                        'status_color'     => $lead->status_color ?? '#3b82f6',
                        'created_at'       => $lead->created_at?->format('Y-m-d H:i:s'),
                        'updated_at'       => $lead->updated_at?->format('Y-m-d H:i:s'),
                    ];
                });

            return Inertia::render('Leads/Index', [
                'leads' => $leads,
                'auth' => [
                    'user' => [
                        'id'    => $currentUser->id,
                        'name'  => $currentUser->name,
                        'email' => $currentUser->email,
                        // Cek role dengan aman
                        'role_name' => $currentUser->role?->name 
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in leads index: ' . $e->getMessage());
            return Inertia::render('Leads/Index', [
                'leads' => [],
                'auth'  => ['user' => null]
            ]);
        }
    }

/**
 * API: Get all leads
 */
public function indexApi()
{
    try {
        Log::info('=== LEADS API CALLED (indexApi) ===');
        
        $currentUser = $this->getCurrentUser();
        
        // Debug: Log semua leads dulu
        $allLeads = Lead::with(['status', 'assignedUser'])
            ->where('deleted_at', null)
            ->orderByDesc('created_at')
            ->get();
        
        Log::info('Total leads in DB:', [$allLeads->count()]);
        Log::info('First lead (if any):', $allLeads->first() ? [
            'id' => $allLeads->first()->id,
            'company_name' => $allLeads->first()->company_name,
            'assigned_to' => $allLeads->first()->assigned_to,
            'assigned_user' => $allLeads->first()->assignedUser ? $allLeads->first()->assignedUser->id : null,
        ] : 'No leads');
        
        // Transform dengan error handling
        $leads = $allLeads->map(function ($lead) use ($currentUser) {
            try {
                $assignedUserData = null;
                
                if ($lead->assignedUser) {
                    $assignedUserData = [
                        'id' => $lead->assignedUser->id,
                        'name' => $lead->assignedUser->name,
                        'email' => $lead->assignedUser->email,
                    ];
                }
                
                return [
                    'id' => $lead->id,
                    'company_name' => $lead->company_name,
                    'address' => $lead->address,
                    'contact_person' => $lead->contact_person,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'assigned_to' => $lead->assigned_to,
                    'assigned_user' => $assignedUserData,
                    'lead_statuses_id' => $lead->lead_statuses_id,
                    'status_name' => $lead->status ? $lead->status->name : 'New',
                    'status_color' => $lead->status ? $lead->status->color : '#3b82f6',
                    'created_at' => $lead->created_at ? $lead->created_at->format('Y-m-d H:i:s') : null,
                    'updated_at' => $lead->updated_at ? $lead->updated_at->format('Y-m-d H:i:s') : null,
                ];
            } catch (\Exception $e) {
                Log::error('Error transforming lead ' . $lead->id . ': ' . $e->getMessage());
                return null;
            }
        })->filter(); // Hapus null values
        
        Log::info('Transformed leads count:', [$leads->count()]);
        
        $currentUserData = $currentUser ? [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'is_admin' => $this->isAdmin($currentUser),
        ] : null;
        
        return response()->json([
            'leads' => $leads->values(), // Reset keys
            'current_user' => $currentUserData,
            'debug' => [
                'total_leads' => $allLeads->count(),
                'transformed_leads' => $leads->count(),
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('CRITICAL ERROR in indexApi: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'error' => 'Server Error',
            'message' => $e->getMessage(),
            'trace' => env('APP_DEBUG') ? $e->getTraceAsString() : null,
        ], 500);
    }
}

    /**
     * API: Create new lead (SIMPLE VERSION)
     */
    public function store(StoreLeadRequest $request)
    {   
        DB::beginTransaction();
        try {
            Log::info('=== STORE LEAD ===');
            Log::info('Request data:', $request->all());
            Log::info('Auth user:', [Auth::user()]);
            
            $data = $request->validated();
            $currentUser = Auth::user();
            
            // Auto-assign jika ada user login
            if ($currentUser) {
                $data['assigned_to'] = $currentUser->id;
                $data['created_by'] = $currentUser->id;
                $data['updated_by'] = $currentUser->id;
            }
            
            // Set default status jika tidak ada
            if (!isset($data['lead_statuses_id']) || empty($data['lead_statuses_id'])) {
                $defaultStatus = LeadStatuses::where('deleted', false)
                    ->orderBy('order')
                    ->first();
                if ($defaultStatus) {
                    $data['lead_statuses_id'] = $defaultStatus->id;
                }
            }
            
            Log::info('Creating lead with data:', $data);
            
            $lead = Lead::create($data);
            
            DB::commit();

            $lead->load(['status', 'assignedUser']);
            
            Log::info('Lead created successfully:', [$lead->id]);

            return response()->json([
                'message' => 'Lead created successfully',
                'data' => $lead
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create lead: ' . $e->getMessage());
            
            return response()->json(['error_debug' => $e->getMessage()], 500);
        }
    }

    /**
     * API: Update lead (SIMPLE VERSION)
     */
    public function update(UpdateLeadRequest $request, $id)
    {
        DB::beginTransaction();
        try {
            $lead = Lead::with(['status', 'assignedUser'])
                ->where('id', $id)
                ->firstOrFail();
            
            $data = $request->validated();
            
            // Update updated_by jika ada user login
            if (Auth::user()) {
                $data['updated_by'] = Auth::id();
            }
            
            $lead->update($data);
            
            DB::commit();

            $lead->refresh()->load(['status', 'assignedUser']);
            
            return response()->json([
                'message' => 'Lead updated successfully',
                'data' => $lead
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update lead: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to update lead',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API: Delete lead (SOFT DELETE)
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $lead = Lead::find($id);
            
            if (!$lead) {
                return response()->json([
                    'error' => 'Lead not found'
                ], 404);
            }
            
            // Set deleted_by jika ada user login
            if (Auth::user()) {
                $lead->deleted_by = Auth::id();
                $lead->save();
            }
            
            $lead->delete();
            
            DB::commit();

            return response()->json([
                'message' => 'Lead deleted successfully',
                'deleted_id' => $id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete lead: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to delete lead',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API: Get all lead statuses
     */
    public function getStatuses()
    {
        try {
            $statuses = LeadStatuses::where('deleted', false)
                ->orderBy('order')
                ->get(['id', 'name', 'color', 'color_name', 'order']);
            
            return response()->json($statuses);
        } catch (\Exception $e) {
            Log::error('Failed to fetch lead statuses: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch statuses'
            ], 500);
        }
    }

    /**
     * API: Get current user info
     */
    public function getCurrentUserInfo()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'No user logged in'
                ], 401);
            }
            
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $this->isAdmin($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get current user info: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to get user information'
            ], 500);
        }
    }

    /**
     * API: Test endpoint
     */
    public function test()
    {
        $currentUser = Auth::user();
        
        return response()->json([
            'message' => 'LeadController is working',
            'timestamp' => now()->toDateTimeString(),
            'statuses_count' => LeadStatuses::where('deleted', false)->count(),
            'leads_count' => Lead::count(),
            'current_user' => $currentUser ? [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
            ] : null,
            'session_id' => session()->getId(),
            'auth_check' => Auth::check(),
        ]);
    }

    /**
     * Check if user is admin
     */
    private function isAdmin($user)
    {
        if (!$user) return false;
        
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('admin');
        }
        
        if (isset($user->role)) {
            return $user->role === 'admin';
        }
        
        if (isset($user->is_admin)) {
            return (bool) $user->is_admin;
        }
        
        return false;
    }
}