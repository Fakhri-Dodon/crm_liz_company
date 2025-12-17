<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Lead;

class LeadController extends Controller
{
    public function index()
    {
        return Lead::where('deleted', false)
            ->orderByDesc('created_at')
            ->get();
    }

    public function store(StoreLeadRequest $request)
    {
        $lead = Lead::create([
            $request->validated(),
            'created_by' => auth()->id(),
        ]);

        return response()->json($lead, 201);
    }

    public function update(UpdateLeadRequest $request, $id)
    {
        $lead = Lead::findOrFail($id);

        $lead->update([
            $request->validated(),
            'updated_by' => auth()->id(),
        ]);

        return response()->json($lead);
    }

    public function destroy($id)
    {
        $lead = Lead::findOrFail($id);

        $lead->update([
            'deleted'     => true,
            'deleted_by' => auth()->id(),
        ]);

        $lead->delete();

        return response()->json(['message' => 'Lead deleted']);
    }
}

