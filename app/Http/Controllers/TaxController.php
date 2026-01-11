<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ppn;
use App\Models\Pph;

class TaxController extends Controller
{
    public function ppnStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        Ppn::create($validated);

        return redirect()->back()->with('success', 'Create PPN Success');
    }

    public function ppnUpdate(Request $request, $id)
    {
        $ppn = Ppn::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $ppn->update($validated);

        return redirect()->back()->with('success', 'PPN berhasil diperbarui');
    }

    public function ppnDestroy(string $id)
    {
        $ppn = Ppn::findOrFail($id);
        $ppn->delete();

        return redirect()->back()->with('success', 'PPN berhasil dihapus');
    }

    public function pphStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        Pph::create($validated);

        return redirect()->back()->with('success', 'Create PPH Success');
    }

    public function pphUpdate(Request $request, $id)
    {
        $pph = Pph::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $pph->update($validated);

        return redirect()->back()->with('success', 'Update PPH Success');
    }

    public function pphDestroy(string $id)
    {
        $pph = Pph::findOrFail($id);
        $pph->delete();

        return redirect()->back()->with('success', 'Delete PPH Success');
    }
}
