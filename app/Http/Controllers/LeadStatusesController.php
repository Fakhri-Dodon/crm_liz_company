<?php

namespace App\Http\Controllers;

use App\Models\LeadStatuses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeadStatusesController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'note' => 'nullable|string',
            'color' => 'required|string',
            'color_name' => 'required|string'
        ]);

        LeadStatuses::create($validated);

        return back()->with('success', 'New status created successfully.');
    }

    public function update(Request $request, $id)
    {
        $status = LeadStatuses::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'note' => 'nullable|string',
            'color' => 'required|string',
            'color_name' => 'required|string',
        ]);

        $status->update($validated);

        return back()->with('success', 'Status updated.');
    }

    public function destroy($id)
    {
        $status = LeadStatuses::findOrFail($id);

        if ($status->is_system) {
            return back()->with('error', 'System status cannot be deleted.');
        }

        $status->update(['deleted' => 1]);

        return back()->with('success', 'Status removed.');
    }
}