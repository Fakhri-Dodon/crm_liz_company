<?php

namespace App\Http\Controllers;

use App\Models\InvoiceStatuses;
use App\Models\ActivityLogs;
use Illuminate\Http\Request;

class InvoiceStatusesController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'note' => 'nullable|string',
            'color' => 'required|string',
            'color_name' => 'required|string'
        ]);

        InvoiceStatuses::create($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Invoice Status Setting',
            'action' => 'Create',
            'description' => 'Create Invoice Status Setting',
        ]);

        return back()->with('success', 'New status created successfully.');
    }

    public function update(Request $request, $id)
    {
        $status = InvoiceStatuses::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'note' => 'nullable|string',
            'color' => 'required|string',
            'color_name' => 'required|string',
        ]);

        $status->update($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Invoice Status Setting',
            'action' => 'Update',
            'description' => 'Update Invoice Status Setting',
        ]);

        return back()->with('success', 'Status updated.');
    }

    public function destroy($id)
    {
        $status = InvoiceStatuses::findOrFail($id);

        if ($status->is_system) {
            return back()->with('error', 'System status cannot be deleted.');
        }

        $status->update(['deleted' => 1]);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Invoice Status Setting',
            'action' => 'Delete',
            'description' => 'Delete Invoice Status Setting',
        ]);

        return back()->with('success', 'Status removed.');
    }
}
