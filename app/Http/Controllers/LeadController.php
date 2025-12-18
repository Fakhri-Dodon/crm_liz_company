<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Lead;
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
     * Display leads page
     */
    public function index()
    {
        try {
            $leads = Lead::where('deleted', false)
                ->orderByDesc('created_at')
                ->get();

            return Inertia::render('Leads/Index', [
                'leads' => $leads->toArray(),
            ]);
        } catch (\Exception $e) {
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
            $leads = Lead::where('deleted', false)
                ->orderByDesc('created_at')
                ->get();

            return response()->json($leads);
        } catch (\Exception $e) {
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
            
            $data['created_by'] = $userId;
            $data['status'] = $data['status'] ?? 'new';
            $data['id'] = $data['id'] ?? (string) Str::uuid();
            
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $lead = Lead::create($data);
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            DB::commit();

            return response()->json([
                'message' => 'Lead created successfully',
                'data' => $lead
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
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
            $lead = Lead::where('id', $id)
                ->where('deleted', false)
                ->firstOrFail();
            
            $data = $request->validated();
            $userId = $this->getValidUserId();
            $data['updated_by'] = $userId;
            
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $lead->update($data);
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            DB::commit();

            return response()->json([
                'message' => 'Lead updated successfully',
                'data' => $lead
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
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
            
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $lead->delete();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            DB::commit();

            return response()->json([
                'message' => 'Lead permanently deleted',
                'deleted_id' => $id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            return response()->json([
                'error' => 'Failed to delete lead',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}