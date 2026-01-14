<?php

namespace App\Http\Controllers;

use App\Models\PaymentType;
use App\Models\ActivityLogs;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentTypeController extends Controller
{
    public function index()
    {
        return response()->json(PaymentType::where('deleted', 0)->orderBy('order', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'note' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        $validated['slug'] = Str::slug($validated['name'], '_');

        PaymentType::create($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Payment Type Setting',
            'action' => 'Create',
            'description' => 'Create Payment Type',
        ]);

        return back()->with('success', 'Payment type created successfully.');
    }

    public function update(Request $request, $id)
    {
        $pt = PaymentType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'note' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        $validated['slug'] = Str::slug($validated['name'], '_');

        $pt->update($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Payment Type Setting',
            'action' => 'Update',
            'description' => 'Update Payment Type',
        ]);

        return back()->with('success', 'Payment type updated.');
    }

    public function destroy($id)
    {
        $pt = PaymentType::findOrFail($id);

        if ($pt->is_system) {
            return back()->with('error', 'System payment type cannot be deleted.');
        }

        $pt->update(['deleted' => 1]);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Payment Type Setting',
            'action' => 'Delete',
            'description' => 'Delete Payment Type',
        ]);

        return back()->with('success', 'Payment type removed.');
    }
}
