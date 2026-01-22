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
     * Display leads page (Inertia) - FIXED VERSION
     */
    public function index()
    {
        try {
            \Log::info('=== LEAD CONTROLLER INDEX START ===');
            
            // Check authentication
            if (!Auth::check()) {
                \Log::warning('User not authenticated for leads page');
                return Inertia::render('Leads/Index', [
                    'leads' => [],
                    'auth' => ['user' => null],
                    'error' => 'Please login first'
                ]);
            }
            
            $currentUser = Auth::user();
            \Log::info('Current user authenticated', [
                'user_id' => $currentUser->id,
                'user_name' => $currentUser->name
            ]);
            
            // Try to load role safely
            try {
                if (method_exists($currentUser, 'role')) {
                    $currentUser->load('role');
                    \Log::info('User role loaded', [
                        'role_name' => $currentUser->role ? $currentUser->role->name : 'No role'
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning('Could not load user role: ' . $e->getMessage());
            }
            
            // SIMPLE QUERY - Use global scope (where deleted = 0)
            $query = Lead::with(['status', 'assignedUser']);
            
            // Apply access control if scope exists
            if (method_exists(Lead::class, 'scopeApplyAccessControl')) {
                \Log::info('Applying access control scope');
                try {
                    $query->applyAccessControl($currentUser);
                } catch (\Exception $e) {
                    \Log::warning('Error applying access control: ' . $e->getMessage());
                    // Continue without access control
                }
            } else {
                \Log::info('No applyAccessControl scope found on Lead model');
            }
            
            // Get leads (global scope already filters deleted = 0)
            $leads = $query->orderByDesc('created_at')
                ->get()
                ->map(function ($lead) {
                    try {
                        // Safely get assigned user
                        $assignedUserData = null;
                        if ($lead->assignedUser) {
                            $assignedUserData = [
                                'id'    => $lead->assignedUser->id ?? '',
                                'name'  => $lead->assignedUser->name ?? '',
                                'email' => $lead->assignedUser->email ?? '',
                            ];
                        }
                        
                        // Safely get status
                        $statusName = 'New';
                        $statusColor = '#3b82f6';
                        
                        if ($lead->status) {
                            $statusName = $lead->status->name ?? 'New';
                            $statusColor = $lead->status->color ?? '#3b82f6';
                        } elseif (isset($lead->status_name)) {
                            $statusName = $lead->status_name;
                        }
                        
                        if (isset($lead->status_color)) {
                            $statusColor = $lead->status_color;
                        }
                        
                        return [
                            'id'               => $lead->id ?? '',
                            'company_name'     => $lead->company_name ?? '',
                            'address'          => $lead->address ?? '',
                            'contact_person'   => $lead->contact_person ?? '',
                            'position'         => $lead->position ?? '',
                            'email'            => $lead->email ?? '',
                            'phone'            => $lead->phone ?? '',
                            'assigned_to'      => $lead->assigned_to ?? null,
                            'assigned_user'    => $assignedUserData,
                            'lead_statuses_id' => $lead->lead_statuses_id ?? null,
                            'status_name'      => $statusName,
                            'status_color'     => $statusColor,
                            'created_at'       => $lead->created_at ? $lead->created_at->format('Y-m-d H:i:s') : '',
                            'updated_at'       => $lead->updated_at ? $lead->updated_at->format('Y-m-d H:i:s') : '',
                            'is_deleted'       => $lead->deleted ?? 0,
                        ];
                    } catch (\Exception $e) {
                        \Log::error('Error transforming lead: ' . $e->getMessage());
                        return null;
                    }
                })->filter()->values(); // Remove nulls and reset keys
            
            \Log::info('Leads loaded successfully', [
                'count' => $leads->count(),
                'first_lead' => $leads->first()['company_name'] ?? 'none'
            ]);
            
            // Prepare user data for frontend
            $userData = [
                'id'    => $currentUser->id ?? '',
                'name'  => $currentUser->name ?? '',
                'email' => $currentUser->email ?? '',
            ];
            
            // Get role name safely
            $roleName = $this->getUserRoleName($currentUser);
            if ($roleName) {
                $userData['role_name'] = $roleName;
            }
            
            // Get permissions safely
            $permissions = $this->getUserPermissions($currentUser, 'LEAD');
            
            $responseData = [
                'leads' => $leads,
                'auth' => [
                    'user' => $userData
                ],
                'auth_permissions' => $permissions,
            ];
            
            \Log::info('=== LEAD CONTROLLER INDEX END - Success ===');
            
            return Inertia::render('Leads/Index', $responseData);
            
        } catch (\Exception $e) {
            \Log::error('=== FATAL ERROR in LeadController@index ===');
            \Log::error('Error: ' . $e->getMessage());
            \Log::error('File: ' . $e->getFile());
            \Log::error('Line: ' . $e->getLine());
            \Log::error('Full trace: ' . $e->getTraceAsString());
            
            return Inertia::render('Leads/Index', [
                'leads' => [],
                'auth'  => ['user' => null],
                'error' => 'System Error: ' . (env('APP_DEBUG') ? $e->getMessage() : 'Please contact administrator'),
                'debug' => env('APP_DEBUG') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null,
            ]);
        }
    }
    
    /**
     * Get user role name safely
     */
    private function getUserRoleName($user)
    {
        if (!$user) return null;
        
        // Check if role relationship is loaded
        if ($user->relationLoaded('role') && $user->role && isset($user->role->name)) {
            return $user->role->name;
        }
        
        // Check direct properties
        if (isset($user->role_name) && !empty($user->role_name)) {
            return $user->role_name;
        }
        
        if (isset($user->role)) {
            if (is_string($user->role)) {
                return $user->role;
            } elseif (is_object($user->role) && isset($user->role->name)) {
                return $user->role->name;
            }
        }
        
        // Check for is_admin flag as fallback
        if (isset($user->is_admin) && $user->is_admin) {
            return 'Admin';
        }
        
        return 'User';
    }
    
    /**
     * Get user permissions safely
     */
    private function getUserPermissions($user, $module = null)
    {
        if (!$user) return [];
        
        // Default permissions
        $defaultPermissions = [
            'view'   => true,
            'create' => true,
            'update' => true,
            'delete' => true,
        ];
        
        // Check if getPermissions method exists
        if (method_exists($user, 'getPermissions')) {
            try {
                $customPermissions = $user->getPermissions($module);
                if (is_array($customPermissions) && !empty($customPermissions)) {
                    return array_merge($defaultPermissions, $customPermissions);
                }
            } catch (\Exception $e) {
                \Log::warning('getPermissions method error: ' . $e->getMessage());
            }
        }
        
        return $defaultPermissions;
    }

    /**
     * API: Get all leads
     */
    public function indexApi()
    {
        try {
            \Log::info('=== LEADS API CALLED ===');
            
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                    'message' => 'Please login first'
                ], 401);
            }
            
            $currentUser = Auth::user();
            \Log::info('API request from user', [
                'user_id' => $currentUser->id,
                'user_name' => $currentUser->name
            ]);
            
            // Query leads with global scope (deleted = 0)
            $query = Lead::with(['status', 'assignedUser']);
            
            // Apply access control if exists
            if (method_exists(Lead::class, 'scopeApplyAccessControl')) {
                try {
                    $query->applyAccessControl($currentUser);
                } catch (\Exception $e) {
                    \Log::warning('Error applying access control in API: ' . $e->getMessage());
                }
            }
            
            $leads = $query->orderByDesc('created_at')
                ->get()
                ->map(function ($lead) {
                    try {
                        $assignedUserData = null;
                        
                        if ($lead->assignedUser) {
                            $assignedUserData = [
                                'id'    => $lead->assignedUser->id ?? '',
                                'name'  => $lead->assignedUser->name ?? '',
                                'email' => $lead->assignedUser->email ?? '',
                            ];
                        }
                        
                        // Get status info
                        $statusName = 'New';
                        $statusColor = '#3b82f6';
                        
                        if ($lead->status) {
                            $statusName = $lead->status->name ?? 'New';
                            $statusColor = $lead->status->color ?? '#3b82f6';
                        }
                        
                        return [
                            'id'               => $lead->id ?? '',
                            'company_name'     => $lead->company_name ?? '',
                            'address'          => $lead->address ?? '',
                            'contact_person'   => $lead->contact_person ?? '',
                            'email'            => $lead->email ?? '',
                            'phone'            => $lead->phone ?? '',
                            'position'         => $lead->position ?? '',
                            'assigned_to'      => $lead->assigned_to ?? null,
                            'assigned_user'    => $assignedUserData,
                            'lead_statuses_id' => $lead->lead_statuses_id ?? null,
                            'status_name'      => $statusName,
                            'status_color'     => $statusColor,
                            'created_at'       => $lead->created_at ? $lead->created_at->format('Y-m-d H:i:s') : '',
                            'updated_at'       => $lead->updated_at ? $lead->updated_at->format('Y-m-d H:i:s') : '',
                            'is_deleted'       => $lead->deleted ?? 0,
                        ];
                    } catch (\Exception $e) {
                        \Log::error('Error transforming lead in API: ' . $e->getMessage());
                        return null;
                    }
                })->filter()->values();
            
            \Log::info('API response prepared', ['leads_count' => $leads->count()]);
            
            return response()->json([
                'success' => true,
                'leads' => $leads,
                'current_user' => [
                    'id'    => $currentUser->id ?? '',
                    'name'  => $currentUser->name ?? '',
                    'email' => $currentUser->email ?? '',
                    'role'  => $this->getUserRoleName($currentUser) ?? 'User',
                ],
                'meta' => [
                    'total' => $leads->count(),
                    'timestamp' => now()->toDateTimeString(),
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('CRITICAL ERROR in LeadController@indexApi: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'error' => 'Server Error',
                'message' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error',
                'debug' => env('APP_DEBUG') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null,
            ], 500);
        }
    }

    /**
     * API: Create new lead
     */
    public function store(StoreLeadRequest $request)
    {   
        DB::beginTransaction();
        try {
            \Log::info('=== CREATE LEAD REQUEST ===');
            
            $currentUser = Auth::user();
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }
            
            $data = $request->validated();
            \Log::info('Validated data:', $data);
            
            // Auto-assign to current user
            $data['assigned_to'] = $currentUser->id;
            $data['created_by'] = $currentUser->id;
            $data['updated_by'] = $currentUser->id;
            
            // Set default deleted flag
            $data['deleted'] = 0;
            
            // Generate UUID if not provided
            if (empty($data['id'])) {
                $data['id'] = (string) Str::uuid();
                \Log::info('Generated UUID for lead:', ['id' => $data['id']]);
            }
            
            // Set default status if not provided
            if (empty($data['lead_statuses_id'])) {
                $defaultStatus = LeadStatuses::where('deleted', 0)
                    ->orderBy('order')
                    ->first();
                    
                if ($defaultStatus) {
                    $data['lead_statuses_id'] = $defaultStatus->id;
                    \Log::info('Using default status:', ['status_id' => $defaultStatus->id, 'status_name' => $defaultStatus->name]);
                } else {
                    // If no status found, try to get any status
                    $anyStatus = LeadStatuses::first();
                    if ($anyStatus) {
                        $data['lead_statuses_id'] = $anyStatus->id;
                        \Log::info('Using first available status:', ['status_id' => $anyStatus->id]);
                    }
                }
            }
            
            \Log::info('Creating lead with final data:', $data);
            
            $lead = Lead::create($data);
            
            \Log::info('Lead created successfully', ['lead_id' => $lead->id, 'company_name' => $lead->company_name]);
            
            // CREATE COMPANY CONTACT PERSON if contact info exists
            if (!empty($lead->contact_person) && !empty($lead->email)) {
                try {
                    $companyContactPerson = CompanyContactPerson::create([
                        'id'         => (string) Str::uuid(),
                        'lead_id'    => $lead->id,
                        'name'       => $lead->contact_person ?? '',
                        'email'      => $lead->email ?? '',
                        'phone'      => $lead->phone ?? '',
                        'position'   => $lead->position ?? '',
                        'is_primary' => true,
                        'is_active'  => true,
                        'created_by' => $currentUser->id,
                        'updated_by' => $currentUser->id,
                        'deleted'    => 0,
                    ]);
                    
                    \Log::info('CompanyContactPerson created successfully', [
                        'contact_id' => $companyContactPerson->id,
                        'lead_id' => $lead->id
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Failed to create CompanyContactPerson: ' . $e->getMessage());
                    \Log::warning('Continuing without contact person creation...');
                    // Continue without throwing error
                }
            } else {
                \Log::info('Skipping CompanyContactPerson creation - missing contact info');
            }
            
            DB::commit();

            // Load relationships for response
            $lead->load(['status', 'assignedUser']);
            
            \Log::info('Lead creation completed successfully');

            return response()->json([
                'success' => true,
                'message' => 'Lead created successfully',
                'data' => [
                    'id'               => $lead->id,
                    'company_name'     => $lead->company_name,
                    'contact_person'   => $lead->contact_person,
                    'email'            => $lead->email,
                    'phone'            => $lead->phone,
                    'status_name'      => $lead->status ? $lead->status->name : 'New',
                    'status_color'     => $lead->status ? $lead->status->color : '#3b82f6',
                    'assigned_user'    => $lead->assignedUser ? [
                        'id'    => $lead->assignedUser->id,
                        'name'  => $lead->assignedUser->name,
                        'email' => $lead->assignedUser->email,
                    ] : null,
                    'created_at'       => $lead->created_at?->format('Y-m-d H:i:s'),
                ]
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('FAILED to create lead: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            \Log::error('Request data: ', $request->all() ?? []);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create lead',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
                'error_type' => get_class($e),
            ], 500);
        }
    }

    /**
     * API: Update lead
     */
    public function update(UpdateLeadRequest $request, $id)
    {
        DB::beginTransaction();
        try {
            \Log::info('=== UPDATE LEAD REQUEST ===', ['lead_id' => $id]);
            
            $currentUser = Auth::user();
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            // Find active lead (not deleted)
            $lead = Lead::find($id);
            
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found'
                ], 404);
            }
            
            \Log::info('Lead found for update', [
                'lead_id' => $lead->id,
                'company_name' => $lead->company_name,
                'is_deleted' => $lead->deleted
            ]);
            
            // Check if lead is deleted
            if ($lead->deleted == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot update deleted lead'
                ], 400);
            }
            
            $data = $request->validated();
            
            // Update updated_by
            $data['updated_by'] = $currentUser->id;
            
            \Log::info('Updating lead with data:', $data);
            
            // Check if contact info changed
            $contactChanged = false;
            $contactFields = ['contact_person', 'email', 'phone', 'position'];
            
            foreach ($contactFields as $field) {
                if (isset($data[$field]) && $data[$field] != $lead->$field) {
                    $contactChanged = true;
                    break;
                }
            }
            
            // Update lead
            $lead->update($data);
            
            // UPDATE COMPANY CONTACT PERSON if contact info changed
            if ($contactChanged && !empty($lead->contact_person) && !empty($lead->email)) {
                try {
                    // Find existing contact person for this lead
                    $contactPerson = CompanyContactPerson::where('lead_id', $lead->id)
                        ->where('is_primary', true)
                        ->where('deleted', 0)
                        ->first();
                    
                    if ($contactPerson) {
                        // Update existing
                        $contactPerson->update([
                            'name'       => $lead->contact_person,
                            'email'      => $lead->email,
                            'phone'      => $lead->phone,
                            'position'   => $lead->position,
                            'updated_by' => $currentUser->id,
                        ]);
                        
                        \Log::info('CompanyContactPerson updated', [
                            'contact_id' => $contactPerson->id
                        ]);
                    } else {
                        // Create new if doesn't exist
                        $newContact = CompanyContactPerson::create([
                            'id'         => (string) Str::uuid(),
                            'lead_id'    => $lead->id,
                            'name'       => $lead->contact_person,
                            'email'      => $lead->email,
                            'phone'      => $lead->phone,
                            'position'   => $lead->position,
                            'is_primary' => true,
                            'is_active'  => true,
                            'created_by' => $currentUser->id,
                            'updated_by' => $currentUser->id,
                            'deleted'    => 0,
                        ]);
                        
                        \Log::info('CompanyContactPerson created for updated lead', [
                            'contact_id' => $newContact->id
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to update CompanyContactPerson: ' . $e->getMessage());
                    // Continue without throwing error
                }
            }
            
            DB::commit();

            // Reload with relationships
            $lead->refresh()->load(['status', 'assignedUser']);
            
            \Log::info('Lead updated successfully', ['lead_id' => $lead->id]);

            return response()->json([
                'success' => true,
                'message' => 'Lead updated successfully',
                'data' => [
                    'id'               => $lead->id,
                    'company_name'     => $lead->company_name,
                    'contact_person'   => $lead->contact_person,
                    'email'            => $lead->email,
                    'phone'            => $lead->phone,
                    'status_name'      => $lead->status ? $lead->status->name : 'New',
                    'status_color'     => $lead->status ? $lead->status->color : '#3b82f6',
                    'assigned_user'    => $lead->assignedUser ? [
                        'id'    => $lead->assignedUser->id,
                        'name'  => $lead->assignedUser->name,
                        'email' => $lead->assignedUser->email,
                    ] : null,
                    'updated_at'       => $lead->updated_at?->format('Y-m-d H:i:s'),
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('FAILED to update lead ' . $id . ': ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update lead',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    // Di LeadController@destroy - Versi SIMPLE
    public function destroy($id)
    {
        try {
            \Log::info('=== DELETE LEAD REQUEST ===');
            
            $lead = Lead::find($id);
            
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead tidak ditemukan'
                ], 404);
            }
            
            \Log::info("Lead to delete: {$lead->company_name} (ID: {$lead->id})");
            
            // Cek apakah sudah dihapus
            if ($lead->deleted == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead sudah dihapus sebelumnya'
                ], 400);
            }
            
            // Cek data terkait sebelum delete
            $relatedData = $this->checkRelatedData($lead);
            \Log::info("Related data found:", $relatedData);
            
            // Cukup panggil delete(), observer akan handle cascade
            $lead->delete();
            
            // Cek status setelah delete
            $lead->refresh();
            
            return response()->json([
                'success' => true,
                'message' => 'Lead berhasil dihapus',
                'data' => [
                    'id' => $lead->id,
                    'company_name' => $lead->company_name,
                    'deleted_at' => $lead->deleted_at,
                    'deleted' => $lead->deleted,
                    'related_data_before_delete' => $relatedData
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to delete lead: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus lead: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper untuk cek data terkait
     */

    private function checkRelatedData(Lead $lead): array
    {
        $data = [
            'invoices' => 0,
            'payments' => 0,
            'quotations' => 0,
            'company' => null,
            'contacts' => 0,
            'projects' => 0
        ];
        
        try {
            // Cek quotations
            $data['quotations'] = \DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->count();
            
            if ($data['quotations'] > 0) {
                $quotationIds = \DB::table('quotations')
                    ->where('lead_id', $lead->id)
                    ->where('deleted', 0)
                    ->pluck('id')
                    ->toArray();
                
                // Cek invoices MELALUI quotations
                $data['invoices'] = \DB::table('invoices')
                    ->whereIn('quotation_id', $quotationIds)
                    ->where('deleted', 0)
                    ->count();
                
                // Cek payments MELALUI invoices
                if ($data['invoices'] > 0) {
                    $invoiceIds = \DB::table('invoices')
                        ->whereIn('quotation_id', $quotationIds)
                        ->where('deleted', 0)
                        ->pluck('id')
                        ->toArray();
                        
                    $data['payments'] = \DB::table('payments')
                        ->whereIn('invoice_id', $invoiceIds)
                        ->where('deleted', 0)
                        ->count();
                }
                
                // Cek projects MELALUI quotations
                $data['projects'] += \DB::table('projects')
                    ->whereIn('quotation_id', $quotationIds)
                    ->where('deleted', 0)
                    ->count();
            }
            
            // Cek company
            $company = \DB::table('companies')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->orWhere('id', $lead->company_id)
                ->where('deleted', 0)
                ->first();
                
            if ($company) {
                $data['company'] = [
                    'id' => $company->id,
                    'client_code' => $company->client_code
                ];
                
                // Cek contacts dari company
                $data['contacts'] += \DB::table('company_contact_persons')
                    ->where('company_id', $company->id)
                    ->where('deleted', 0)
                    ->count();
                    
                // Cek projects MELALUI company
                $data['projects'] += \DB::table('projects')
                    ->where('client_id', $company->id)
                    ->where('deleted', 0)
                    ->count();
            }
            
            // Cek contacts langsung dari lead
            $data['contacts'] += \DB::table('company_contact_persons')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->count();
            
        } catch (\Exception $e) {
            \Log::warning("Error checking related data: " . $e->getMessage());
        }
        
        return $data;
    }

    /**
     * API: Get single lead
     */
    public function show($id)
    {
        try {
            \Log::info('=== SHOW LEAD REQUEST ===', ['lead_id' => $id]);
            
            $currentUser = Auth::user();
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            // Find lead (allow viewing even if deleted for audit purposes)
            $lead = Lead::with(['status', 'assignedUser', 'contacts'])
                ->find($id);
            
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found'
                ], 404);
            }
            
            \Log::info('Lead retrieved', [
                'lead_id' => $lead->id,
                'company_name' => $lead->company_name,
                'is_deleted' => $lead->deleted
            ]);
            
            // Get related contact persons
            $contacts = [];
            if ($lead->relationLoaded('contacts')) {
                $contacts = $lead->contacts->map(function ($contact) {
                    return [
                        'id'         => $contact->id,
                        'name'       => $contact->name,
                        'email'      => $contact->email,
                        'phone'      => $contact->phone,
                        'position'   => $contact->position,
                        'is_primary' => $contact->is_primary,
                        'is_active'  => $contact->is_active,
                    ];
                })->toArray();
            }
            
            $leadData = [
                'id'                   => $lead->id,
                'company_name'         => $lead->company_name,
                'address'              => $lead->address,
                'contact_person'       => $lead->contact_person,
                'email'                => $lead->email,
                'phone'                => $lead->phone,
                'position'             => $lead->position,
                'assigned_to'          => $lead->assigned_to,
                'assigned_user'        => $lead->assignedUser ? [
                    'id'    => $lead->assignedUser->id,
                    'name'  => $lead->assignedUser->name,
                    'email' => $lead->assignedUser->email,
                ] : null,
                'lead_statuses_id'     => $lead->lead_statuses_id,
                'status_name'          => $lead->status ? $lead->status->name : 'New',
                'status_color'         => $lead->status ? $lead->status->color : '#3b82f6',
                'converted_to_company' => $lead->converted_to_company,
                'converted_at'         => $lead->converted_at?->format('Y-m-d H:i:s'),
                'company_id'           => $lead->company_id,
                'created_at'           => $lead->created_at?->format('Y-m-d H:i:s'),
                'updated_at'           => $lead->updated_at?->format('Y-m-d H:i:s'),
                'is_deleted'           => $lead->deleted,
                'deleted_at'           => $lead->deleted_at?->format('Y-m-d H:i:s'),
                'contacts'             => $contacts,
            ];
            
            \Log::info('Lead data retrieved successfully', ['lead_id' => $id]);
            
            return response()->json([
                'success' => true,
                'data' => $leadData
            ]);
            
        } catch (\Exception $e) {
            \Log::error('FAILED to show lead ' . $id . ': ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve lead',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * API: Get all lead statuses
     */
    public function getStatuses()
    {
        try {
            \Log::info('=== GET LEAD STATUSES ===');
            
            $statuses = LeadStatuses::where('deleted', 0)
                ->orderBy('order')
                ->get(['id', 'name', 'color', 'color_name', 'order', 'created_at'])
                ->map(function ($status) {
                    return [
                        'id'         => $status->id,
                        'name'       => $status->name,
                        'color'      => $status->color,
                        'color_name' => $status->color_name,
                        'order'      => $status->order,
                        'created_at' => $status->created_at?->format('Y-m-d H:i:s'),
                    ];
                });
            
            \Log::info('Lead statuses retrieved', ['count' => $statuses->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $statuses
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fetch lead statuses: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statuses',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
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
                    'success' => false,
                    'message' => 'No user logged in'
                ], 401);
            }
            
            $roleName = $this->getUserRoleName($user);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id'       => $user->id,
                    'name'     => $user->name,
                    'email'    => $user->email,
                    'role'     => $roleName,
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to get current user info: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user information',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * API: Get users for assignment dropdown
     */
    public function getAssignableUsers()
    {
        try {
            $currentUser = Auth::user();
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            $users = User::where('deleted', 0)
                ->where('is_active', 1)
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(function ($user) {
                    return [
                        'id'    => $user->id,
                        'name'  => $user->name,
                        'email' => $user->email,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to get assignable users: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get users',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * API: Test endpoint
     */
    public function test()
    {
        try {
            $currentUser = Auth::user();
            
            $response = [
                'success' => true,
                'message' => 'LeadController is working',
                'timestamp' => now()->toDateTimeString(),
                'statuses_count' => LeadStatuses::where('deleted', 0)->count(),
                'leads_count' => Lead::where('deleted', 0)->count(),
                'leads_total_count' => Lead::count(),
                'current_user' => $currentUser ? [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'email' => $currentUser->email,
                ] : null,
                'session_id' => session()->getId(),
                'auth_check' => Auth::check(),
                'app_debug' => env('APP_DEBUG', false),
                'app_env' => env('APP_ENV', 'production'),
            ];
            
            \Log::info('Test endpoint called', $response);
            
            return response()->json($response);
            
        } catch (\Exception $e) {
            \Log::error('Test endpoint error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}