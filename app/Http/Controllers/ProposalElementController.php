<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\ProposalElementTemplate;
use App\Notifications\DocumentNotification;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redirect;

class ProposalElementController extends Controller
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
    public function create(Request $request)
    {

        $request->validate([
            'name'  => 'required|string',
        ]);

        return Inertia::render('Settings/CreateProposals', [
            'name'  => $request->name,
        ]);

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
        $validated = $request->validate([
            'name'      => 'required',
            'html'      => 'required',
            'css'       => 'required',
            'categories'=> 'required',
            'image'     => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request, $validated) {

                $image = $validated['image'];

                if ($image) {
                    
                    if (!empty($element->preview_image)) {
                        $oldPath = 'proposal_thumbnails/' . $element->preview_image;

                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->delete($oldPath);
                        }
                    }

                    $image = str_replace('data:image/png;base64,', '', $image);
                    $image = str_replace(' ', '+', $image);

                    $fileName = 'proposal_' . time() . '.png';

                    Storage::disk('public')->put(
                        'proposal_thumbnails/' . $fileName,
                        base64_decode($image)
                    );

                }

                $template = ProposalElementTemplate::create([
                    'name'          => $validated['name'],
                    'slug'          => Auth::id(),
                    'content_json'  => $validated['html'],
                    'preview_image' => $fileName ?? NULL,
                    'html_output'   => $validated['html'],
                    'css_output'    => $validated['css'],
                    'created_by'    => auth()->id(),
                ]);
                
                return response()->json([
                    'success'   => true,
                    'redirect'  => route('settings.proposals'),
                ]);

            });
        } catch (\Exception $e) {
            if (isset($oldPath)) Storage::disk('public')->delete($oldPath);
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }

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
    public function edit(Request $request, $id)
    {

        $request->validate([
            'name'  => 'required|string',
        ]);

        $template = ProposalElementTemplate::where('id', $id)->first();

        return Inertia::render('Settings/EditProposals', [
            'id'        => $id,
            'name'      => $request->name,
            'template'  => $template,
        ]);

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        
        $validated = $request->validate([
            'name'      => 'required',
            'html'      => 'required',
            'css'       => 'required',
            'categories'=> 'required',
            'image'     => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request, $validated, $id) {

                $element = ProposalElementTemplate::findOrFail($id);

                $image = $validated['image'];

                if ($image) {
                    
                    if (!empty($element->preview_image)) {
                        $oldPath = 'proposal_thumbnails/' . $element->preview_image;

                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->delete($oldPath);
                        }
                    }

                    $image = str_replace('data:image/png;base64,', '', $image);
                    $image = str_replace(' ', '+', $image);

                    $fileName = 'proposal_' . time() . '.png';

                    Storage::disk('public')->put(
                        'proposal_thumbnails/' . $fileName,
                        base64_decode($image)
                    );
                }

                $element->name          = $validated['name'];
                $element->content_json  = $validated['html'];
                $element->preview_image = $fileName ?? NULL;
                $element->html_output   = $validated['html'];
                $element->css_output    = $validated['css'];
                $element->updated_by    = Auth::id();
                $element->save();
                
                return response()->json([
                    'success'   => true,
                    'redirect'  => route('settings.proposals'),
                ]);

            });
        } catch (\Exception $e) {
            if (isset($oldPath)) Storage::disk('public')->delete($oldPath);
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {

        try {

            $element = ProposalElementTemplate::findOrFail($id);

            $element->deleted = 1;
            $element->deleted_at = Carbon::now();
            $element->deleted_by = Auth::id();
            $element->save();

            return redirect()->route('settings.proposals')
                ->with('success', 'Proposal deleted successfully!');
        
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'msg' => 'Gagal menghapus data: ' . $e->getMessage(),
            ], 500);
        }

    }

    public function editNama(Request $request, $id)
    {
        
        $validated = $request->validate([
            'name'  => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request, $validated, $id) {

                $element = ProposalElementTemplate::findOrFail($id);

                $element->name          = $validated['name'];
                $element->updated_by    = Auth::id();
                $element->save();
                
                return Redirect::back()->with('success', 'Numbering setting updated successfully!');

            });
        } catch (\Exception $e) {
            if (isset($oldPath)) Storage::disk('public')->delete($oldPath);
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }

    }

}
