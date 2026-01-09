<?php

namespace App\Http\Controllers;

use App\Models\ProposalNumberFormatted;
use App\Models\ActivityLogs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProposalNumberFormated extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'prefix'      => 'required|string|max:10',
            'padding'     => 'required|integer|min:1|max:10',
            'next_number' => 'required|integer|min:1',
        ]);

        // Gunakan nama model yang benar (ProposalNumberFormatted)
        $numbering = ProposalNumberFormatted::find($id);

        if (!$numbering) {
            return Redirect::back()->withErrors(['message' => 'Data numbering tidak ditemukan.']);
        }

        // Cek is_deleted (asumsi kolom ini ada di database)
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
                'module' => 'Proposal Number Formatted Setting',
                'action' => 'Update',
                'description' => 'Update Proposal Number Formatted Setting',
            ]);

            return Redirect::back()->with('success', 'Numbering setting updated successfully!');
        } catch (\Exception $e) {
            return Redirect::back()->withErrors(['message' => 'Gagal memperbarui data: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
