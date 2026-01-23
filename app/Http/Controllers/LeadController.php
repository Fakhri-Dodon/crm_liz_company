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