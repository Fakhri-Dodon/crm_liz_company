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
use Illuminate\Support\Str;

class LeadController extends Controller
{
    /**
     * Get valid user ID or NULL
     */
    private function getValidUserId()
    {
        try {
            $firstUser = User::first();
            return $firstUser ? $firstUser->id : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get default status ID
     */
    private function getDefaultStatusId()
    {
        try {
            $defaultStatus = LeadStatuses::where('deleted', false)
                ->orderBy('order')
                ->first();
            
            return $defaultStatus ? $defaultStatus->id : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Display leads page
     */
    public function index()
    {
        try {
            $leads = Lead::with('status')
                ->where('deleted', false)
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($lead) {
                    return [
                        'id' => $lead->id,
                        'company_name' => $lead->company_name,
                        'address' => $lead->address,
                        'contact_person' => $lead->contact_person,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'assigned_to' => $lead->assigned_to,
                        'lead_statuses_id' => $lead->lead_statuses_id,
                        'status_name' => $lead->status ? $lead->status->name : 'New',
                        'status_color' => $lead->status ? $lead->status->color : '#3b82f6',
                        'created_at' => $lead->created_at,
                        'updated_at' => $lead->updated_at,
                    ];
                });

            return Inertia::render('Leads/Index', [
                'leads' => $leads,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch leads: ' . $e->getMessage());
            return Inertia::render('Leads/Index', [
                'leads' => [],
            ]);
        }
    }

    /**
     * API: Get all leads
     */
    public function indexApi()
    {
        try {
            $leads = Lead::with('status')
                ->where('deleted', false)
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($lead) {
                    return [
                        'id' => $lead->id,
                        'company_name' => $lead->company_name,
                        'address' => $lead->address,
                        'contact_person' => $lead->contact_person,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'assigned_to' => $lead->assigned_to,
                        'lead_statuses_id' => $lead->lead_statuses_id,
                        'status_name' => $lead->status ? $lead->status->name : 'New',
                        'status_color' => $lead->status ? $lead->status->color : '#3b82f6',
                        'status' => $lead->status,
                        'created_at' => $lead->created_at,
                        'updated_at' => $lead->updated_at,
                    ];
                });

            return response()->json($leads);
        } catch (\Exception $e) {
            Log::error('Failed to fetch leads API: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch leads'
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
            $data = $request->validated();
            $userId = $this->getValidUserId();
            
            Log::info('=== STORE LEAD REQUEST ===');
            Log::info('Request data:', $data);
            
            // Check if lead_statuses_id exists and is valid
            if (!isset($data['lead_statuses_id']) || empty($data['lead_statuses_id'])) {
                $defaultStatusId = $this->getDefaultStatusId();
                if (!$defaultStatusId) {
                    return response()->json([
                        'error' => 'No lead statuses found. Please create a status first.'
                    ], 400);
                }
                $data['lead_statuses_id'] = $defaultStatusId;
                Log::info('Using default status ID:', [$defaultStatusId]);
            } else {
                // Validate that the status exists
                $statusExists = LeadStatuses::where('id', $data['lead_statuses_id'])
                    ->where('deleted', false)
                    ->exists();
                
                if (!$statusExists) {
                    return response()->json([
                        'error' => 'Selected status does not exist.'
                    ], 400);
                }
            }
            
            $data['created_by'] = $userId;
            $data['id'] = $data['id'] ?? (string) Str::uuid();
            
            Log::info('Creating lead with data:', $data);
            
            // Create lead
            $lead = Lead::create($data);
            
            DB::commit();

            // Load the status relationship
            $lead->load('status');
            
            Log::info('Lead created successfully. ID:', [$lead->id]);
            Log::info('Lead status:', [$lead->status]);

            return response()->json([
                'message' => 'Lead created successfully',
                'data' => $lead
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create lead: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'error' => 'Failed to create lead',
                'message' => $e->getMessage()
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
            $lead = Lead::with('status')
                ->where('id', $id)
                ->where('deleted', false)
                ->firstOrFail();
            
            $data = $request->validated();
            $userId = $this->getValidUserId();
            $data['updated_by'] = $userId;
            
            Log::info('=== UPDATE LEAD REQUEST ===');
            Log::info('Lead ID:', [$id]);
            Log::info('Request data:', $data);
            Log::info('Current lead_statuses_id:', [$lead->lead_statuses_id]);
            Log::info('Current status name:', [$lead->status ? $lead->status->name : 'null']);
            
            // Validate and handle lead_statuses_id
            if (isset($data['lead_statuses_id']) && !empty($data['lead_statuses_id'])) {
                // Check if the new status exists
                $statusExists = LeadStatuses::where('id', $data['lead_statuses_id'])
                    ->where('deleted', false)
                    ->exists();
                
                if (!$statusExists) {
                    Log::warning('Status not found:', [$data['lead_statuses_id']]);
                    return response()->json([
                        'error' => 'Selected status does not exist.'
                    ], 400);
                }
                
                Log::info('Updating status to new ID:', [$data['lead_statuses_id']]);
                
                // Get the new status for logging
                $newStatus = LeadStatuses::find($data['lead_statuses_id']);
                Log::info('New status name:', [$newStatus ? $newStatus->name : 'null']);
                
            } else {
                // If lead_statuses_id is not provided, keep the existing one
                $data['lead_statuses_id'] = $lead->lead_statuses_id;
                Log::info('No new status provided, keeping current:', [$data['lead_statuses_id']]);
            }
            
            Log::info('Final data for update:', $data);
            
            // Update the lead
            $lead->update($data);
            
            DB::commit();

            // Refresh the model to get updated relationships
            $lead->refresh()->load('status');
            
            Log::info('Lead updated successfully');
            Log::info('Updated lead_statuses_id:', [$lead->lead_statuses_id]);
            Log::info('Updated status name:', [$lead->status ? $lead->status->name : 'null']);

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
     * API: Delete lead (HARD DELETE)
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
            
            Log::info('Deleting lead:', [$id, $lead->company_name]);
            $lead->delete();
            
            DB::commit();

            return response()->json([
                'message' => 'Lead permanently deleted',
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
            
            Log::info('Fetched statuses count:', [$statuses->count()]);
            Log::info('Statuses:', $statuses->toArray());
            
            return response()->json($statuses);
        } catch (\Exception $e) {
            Log::error('Failed to fetch lead statuses: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch statuses'
            ], 500);
        }
    }

    /**
     * API: Test endpoint
     */
    public function test()
    {
        return response()->json([
            'message' => 'LeadController is working',
            'timestamp' => now()->toDateTimeString(),
            'statuses_count' => LeadStatuses::where('deleted', false)->count(),
            'leads_count' => Lead::where('deleted', false)->count(),
        ]);
    }
}