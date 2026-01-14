<?php

namespace App\Http\Controllers;

use App\Models\InvoiceNumberFormated;
use App\Models\ActivityLogs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class InvoiceNumberFormatted extends Controller
{
    public function update(Request $request, string $id)
    {
        $request->validate([
            'prefix'      => 'required|string|max:10',
            'padding'     => 'required|integer|min:1|max:10',
            'next_number' => 'required|integer|min:1',
        ]);

        $numbering = InvoiceNumberFormated::find($id);

        if (!$numbering) {
            return Redirect::back()->withErrors(['message' => 'Data numbering tidak ditemukan.']);
        }

        if ($numbering->deleted) {
            return Redirect::back()->withErrors(['message' => 'Data ini sudah dihapus dan tidak bisa diubah.']);
        }

        try {
            $numbering->update([
                'prefix'      => $request->prefix,
                'padding'     => $request->padding,
                'next_number' => $request->next_number,
            ]);

            ActivityLogs::create([
                'user_id' => auth()->id(),
                'module' => 'Invoice Number Formatted Setting',
                'action' => 'Update',
                'description' => 'Update Invoice Number Formatted Setting',
            ]);

            return Redirect::back()->with('success', 'Numbering setting updated successfully!');
        } catch (\Exception $e) {
            return Redirect::back()->withErrors(['message' => 'Gagal memperbarui data: ' . $e->getMessage()]);
        }
    }
}
