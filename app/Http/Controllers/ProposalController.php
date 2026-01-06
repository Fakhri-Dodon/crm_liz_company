<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Lead;
use App\Models\Proposal;
use App\Models\ProposalStatuses;
use App\Models\ProposalElementTemplate;
use App\Models\ProposalNumberFormatted;
use App\Notifications\DocumentNotification;
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
    public function index(Request $request)
    {

        $filterData = Proposal::select('id', 'title')
            ->where('deleted', 0)
            ->groupBy('id', 'title')
            ->get()
            ->pluck('id', 'title')
            ->toArray();

        $summary = Proposal::select('status', DB::raw('count(*) as count'))
            ->where('deleted', 0)
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $query = Proposal::with(['lead', 'proposal_element_template', 'creator'])->applyAccessControl()->where('deleted', 0);

        // Filter Search
        $query->when($request->input('search'), function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('title', 'like', "%{$search}%")
                    ->orWhere('proposal_number', 'like', "%{$search}%")
                    ->orWhereHas('lead', function ($leadQuery) use ($search) {
                        $leadQuery->where('company_name', 'like', "%{$search}%");
                    });
            });
        });

        // Filter ID
        $query->when($request->input('proposal_id') && $request->input('proposal_id') !== 'all', function ($q) use ($request) {
            $q->where('id', $request->input('proposal_id'));
        });

        // Filter Status
        $query->when($request->input('status') && $request->input('status') !== 'all', function ($q) use ($request) {
            $q->where('status', $request->input('status'));
        });

        // Pagination
        $proposals = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($proposals) {
                $proposals->is_client = \DB::table('companies')
                    ->where('lead_id', $proposals->lead_id)
                    ->exists();

                $proposals->date = Carbon::parse($proposals->created_at)->format('d-m-Y');
                $proposals->edited = (bool) !empty(
                    $proposals->proposal_element_template?->html_output
                );
                    
                return $proposals;
            })
            ->withQueryString();

        $lead = Lead::where('deleted', 0)
            ->whereNull('deleted_at')
            ->select('id', 'company_name')
            ->orderBy('company_name', 'desc')
            ->get();

        return Inertia::render('Proposals/Index', [
            'proposals' => $proposals,
            'filters'   => $request->only(['search', 'proposal_id', 'status']),
            'statusOptions' => [
                ['value' => 'draft', 'label' => 'Draft'],
                ['value' => 'sent', 'label' => 'Sent'],
                ['value' => 'opened', 'label' => 'Opened'],
                ['value' => 'rejected', 'label' => 'Rejected'],
                ['value' => 'failed', 'label' => 'Failed'],
            ],
            'filterData'=> $filterData,
            'summary'   => $summary,
            'lead'      => $lead,
        ]);

    }

    public function add(Request $request)
    {

        $validated = $request->validate([
            'name'      => 'required|string',
            'lead_id'   => 'required|exists:leads,id', 
        ]);

        try {
            return DB::transaction(function () use ($request, $validated) {

                $last = Proposal::where('deleted', false)
                    ->lockForUpdate()
                    ->orderByRaw('CAST(SUBSTRING(proposal_number, -5) AS UNSIGNED) DESC')
                    ->first();

                $nextNumber = $last
                    ? ((int) substr($last->proposal_number, -5)) + 1
                    : 1;

                $proposalFormat = ProposalNumberFormatted::where('deleted', false)->first();
                $format = $proposalFormat ? $proposalFormat->prefix : NULL;

                $resultNumber = $format . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

                $status = ProposalStatuses::where('name', 'Draft')->where('deleted', false)->first();

                $template = ProposalElementTemplate::create([
                    'name'          => $validated['name'],
                    'content_json'  => '-',
                    'preview_image' => '-',
                    'created_by'    => auth()->id(),
                ]);

                $proposal = Proposal::create([
                    'proposal_number_formated_id'   => $proposalFormat->id,
                    'proposal_element_template_id'  => $template->id,
                    'proposal_statuses_id'          => $status->id,
                    'lead_id'                       => $validated['lead_id'],
                    'proposal_number'               => $resultNumber,
                    'title'                         => $validated['name'],
                    'content_json'                  => '-',
                    'view_token'                    => $resultNumber,
                    'created_by'                    => auth()->id(),
                ]);

                return redirect()->route('proposal.addProposal', $proposal->id);

            });

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }

    }

    public function addProposal($id)
    {

        $templates = ProposalElementTemplate::where('deleted', false)
            ->whereNotNull('html_output')
            ->get();

        return Inertia::render('Proposals/AddProposal', [
            'proposal_id'   => $id,
            'templates'     => $templates
        ]);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {

        $template = ProposalElementTemplate::where('id', $request->id)->first();

        return Inertia::render('Proposals/Create', [
            'id'        => $request->id_proposal,
            'template'  => $template,
        ]);

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
        $validated = $request->validate([
            'id'        => 'required|exists:proposals,id',
            'html'      => 'required',
            'css'       => 'required',
            'categories'=> 'required',
            'image'     => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request, $validated) {
        
                $proposal = Proposal::where('id', $validated['id'])->first();

                $element = ProposalElementTemplate::findOrFail($proposal->proposal_element_template_id);

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

                $element->content_json  = $validated['html'];
                $element->preview_image = $fileName ?? NULL;
                $element->html_output   = $validated['html'];
                $element->css_output    = $validated['css'];
                $element->updated_by    = Auth::id();
                $element->save();

                $managers = User::whereHas('role', function($q) {
                    $q->where('name', 'manager'); 
                })->get();
                foreach ($managers as $manager) {
                    $manager->notifications()
                            ->where('data->id', (string)$proposal->id)
                            ->where('data->type', 'proposals')
                            ->delete();

                    $manager->notify(new DocumentNotification([
                        'id'      => $proposal->id,
                        'type'    => 'proposals',
                        'status'  => 'draft',
                        'message' => "proposals baru #{$proposal->proposal_number} menunggu persetujuan.",
                    ]));
                }
                
                return response()->json([
                    'success' => true,
                    'redirect' => route('proposal.index'),
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
    public function show($id)
    {

        $data = ProposalElementTemplate::findOrFail($id);

        return Inertia::render('Proposals/Show', [
            'html' => $data->html_output,
            'css'  => $data->css_output,
        ]);

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
    public function update(Request $request, $id)
    {

        $validated = $request->validate([
            'name'      => 'required|string',
            'lead_id'   => 'required|exists:leads,id', 
        ]);

        try {

            $proposal = Proposal::findOrFail($id);
            $proposal->lead_id      = $validated['lead_id'];
            $proposal->title        = $validated['name'];
            $proposal->updated_by   = Auth::id();
            $proposal->save();

            $element = ProposalElementTemplate::findOrFail($proposal->proposal_element_template_id);

            if ($element && !empty($element->html_output)) {
                return redirect()->route('proposal.create', ['id_proposal' => $proposal->id, 'id' => $element->id])->with('message', 'Proposal updated successfully!');
            }

            return redirect()->route('proposal.addProposal', $proposal->id)->with('message', 'Proposal updated successfully!');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {

        try {

            $proposal = Proposal::findOrFail($id);

            // $element = ProposalElementTemplate::findOrFail($proposal->proposal_element_template_id);
                    
            // if (!empty($element->preview_image)) {
            //     $oldPath = 'proposal_thumbnails/' . $element->preview_image;

            //     if (Storage::disk('public')->exists($oldPath)) {
            //         Storage::disk('public')->delete($oldPath);
            //     }
            // }

            $proposal->deleted = 1;
            $proposal->deleted_at = Carbon::now();
            $proposal->deleted_by = Auth::id();
            $proposal->save();

            // $element->deleted = 1;
            // $element->deleted_at = Carbon::now();
            // $element->deleted_by = Auth::id();
            // $element->save();

            return redirect()->route('proposal.index')
                ->with('success', 'Proposal deleted successfully!');
        
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'msg' => 'Gagal menghapus data: ' . $e->getMessage(),
            ], 500);
        }

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
