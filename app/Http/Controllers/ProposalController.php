<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProposalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Proposals/Index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {

        return Inertia::render('Proposals/Create', [
            'id'    => $request->id,
            'name'  => $request->name,
        ]);

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        return $request->all();
        
        $validated = $request->validate([
            'html'  => 'required',
            'css'   => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request, $validated) {
        
                // DB::table('proposal_element_template')

            });
        } catch (\Exception $e) {
            if (isset($path)) Storage::disk('public')->delete($path);
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }

    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {



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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function templates()
    {
        
        $files = Storage::disk('public')->files('templates');

        $allTemplates = [];

        foreach ($files as $file) {
            if (str_ends_with($file, '.json')) {
                $content = Storage::disk('public')->get($file);
                $decoded = json_decode($content, true);

                if (is_array($decoded)) {
                    // Jika isi file adalah array [ {...}, {...} ], gabungkan ke array utama
                    $allTemplates = array_merge($allTemplates, $decoded);
                }
            }
        }

        return response()->json($allTemplates);

    }

}
