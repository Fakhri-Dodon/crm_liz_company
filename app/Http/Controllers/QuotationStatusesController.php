<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\QuotationStatuses;
use App\Models\ActivityLogs;
use Illuminate\Support\Facades\Auth;

class QuotationStatusesController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'note' => 'nullable|string',
            'color' => 'required|string',
            'color_name' => 'required|string'
        ]);

        QuotationStatuses::create($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Quotation Status Setting',
            'action' => 'Create',
            'description' => 'Create Quotation Status Setting',
        ]);

        return back()->with('success', 'New status created successfully.');
    }

    public function update(Request $request, $id)
    {
        $status = QuotationStatuses::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'note' => 'nullable|string',
            'color' => 'required|string',
            'color_name' => 'required|string',
        ]);

        $status->update($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Quotation Status Setting',
            'action' => 'Update',
            'description' => 'Update Quotation Status Setting',
        ]);

        return back()->with('success', 'Status updated.');
    }

    public function destroy($id)
    {
        $status = QuotationStatuses::findOrFail($id);

        if ($status->is_system) {
            return back()->with('error', 'System status cannot be deleted.');
        }

        $status->update(['deleted' => 1]);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Quotation Status Setting',
            'action' => 'Delete',
            'description' => 'Delete Quotation Status Setting',
        ]);

        return back()->with('success', 'Status removed.');
    }
}
