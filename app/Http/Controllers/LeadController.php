<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Lead;
use App\Models\LeadStatuses;
use App\Models\CompanyContactPerson;
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
     * Create company contact person from lead
     */
    private function createCompanyContactPersonFromLead($lead, $currentUser)
    {
        try {
            Log::info('Creating CompanyContactPerson from lead:', [
                'lead_id' => $lead->id,
                'company_name' => $lead->company_name,
                'contact_person' => $lead->contact_person,
            ]);

            // Cek apakah contact person sudah ada untuk lead ini
            $existingContact = CompanyContactPerson::where('lead_id', $lead->id)
                ->where('email', $lead->email)
                ->first();

            if ($existingContact) {
                Log::info('CompanyContactPerson already exists for this lead:', [
                    'contact_id' => $existingContact->id
                ]);
                return $existingContact;
            }

            // Buat company contact person baru
            $companyContactPerson = CompanyContactPerson::create([
                'id' => (string) Str::uuid(),
                'lead_id' => $lead->id,
                'company_id' => null, // Belum ada company, nanti diisi saat lead jadi client
                'name' => $lead->contact_person,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'position' => $lead->position,
                'is_primary' => true, // Default sebagai kontak utama
                'is_active' => true,
                'created_by' => $currentUser ? $currentUser->id : null,
                'updated_by' => $currentUser ? $currentUser->id : null,
                'deleted' => 0,
            ]);

            Log::info('CompanyContactPerson created successfully:', [
                'contact_id' => $companyContactPerson->id,
                'lead_id' => $lead->id
            ]);

            return $companyContactPerson;

        } catch (\Exception $e) {
            Log::error('Failed to create CompanyContactPerson from lead: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return null;
        }
    }

    /**
     * Update existing company contact person from lead
     */
    private function updateCompanyContactPersonFromLead($lead, $currentUser)
    {
        try {
            Log::info('Updating CompanyContactPerson from lead:', [
                'lead_id' => $lead->id,
                'contact_person' => $lead->contact_person,
            ]);

            // Cari contact person berdasarkan lead_id
            $companyContactPerson = CompanyContactPerson::where('lead_id', $lead->id)
                ->where('is_primary', true)
                ->first();

            if (!$companyContactPerson) {
                Log::info('No primary CompanyContactPerson found for this lead, creating new one');
                return $this->createCompanyContactPersonFromLead($lead, $currentUser);
            }

            // Update data contact person
            $companyContactPerson->update([
                'name' => $lead->contact_person,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'position' => $lead->position,
                'updated_by' => $currentUser ? $currentUser->id : null,
            ]);

            Log::info('CompanyContactPerson updated successfully:', [
                'contact_id' => $companyContactPerson->id,
                'lead_id' => $lead->id
            ]);

            return $companyContactPerson;

        } catch (\Exception $e) {
            Log::error('Failed to update CompanyContactPerson from lead: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
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
                        'position'         => $lead->position,
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
                        'role_name' => $currentUser->role?->name,
                    ]
                ],
                'auth_permissions' => auth()->user()->getPermissions('LEAD'),
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
            
            // BUAT COMPANY CONTACT PERSON SECARA OTOMATIS
            if ($lead->contact_person && $lead->email) {
                Log::info('Attempting to create CompanyContactPerson for new lead');
                $companyContactPerson = $this->createCompanyContactPersonFromLead($lead, $currentUser);
                
                if ($companyContactPerson) {
                    Log::info('CompanyContactPerson created/updated successfully', [
                        'lead_id' => $lead->id,
                        'contact_id' => $companyContactPerson->id
                    ]);
                }
            } else {
                Log::warning('Cannot create CompanyContactPerson: missing contact_person or email', [
                    'lead_id' => $lead->id,
                    'has_contact_person' => !empty($lead->contact_person),
                    'has_email' => !empty($lead->email)
                ]);
            }
            
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
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
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
            $currentUser = Auth::user();
            
            // Update updated_by jika ada user login
            if ($currentUser) {
                $data['updated_by'] = $currentUser->id;
            }
            
            // Cek apakah data kontak berubah
            $contactChanged = false;
            $contactFields = ['contact_person', 'email', 'phone', 'position'];
            
            foreach ($contactFields as $field) {
                if (isset($data[$field]) && $data[$field] != $lead->$field) {
                    $contactChanged = true;
                    break;
                }
            }
            
            $lead->update($data);
            
            // UPDATE COMPANY CONTACT PERSON SECARA OTOMATIS jika data kontak berubah
            if ($contactChanged && $lead->contact_person && $lead->email) {
                Log::info('Contact information changed, updating CompanyContactPerson');
                $companyContactPerson = $this->updateCompanyContactPersonFromLead($lead, $currentUser);
                
                if ($companyContactPerson) {
                    Log::info('CompanyContactPerson updated successfully', [
                        'lead_id' => $lead->id,
                        'contact_id' => $companyContactPerson->id
                    ]);
                }
            } else {
                Log::info('Contact information unchanged or missing, skipping CompanyContactPerson update');
            }
            
            DB::commit();

            $lead->refresh()->load(['status', 'assignedUser']);
            
            return response()->json([
                'message' => 'Lead updated successfully',
                'data' => $lead
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update lead: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
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