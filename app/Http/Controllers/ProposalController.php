<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Lead;
use App\Models\Proposal;
use App\Models\ProposalStatuses;
use App\Models\ProposalElementTemplate;
use App\Models\ProposalNumberFormatted;
use App\Models\ActivityLogs;
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
                $proposals->is_client = DB::table('companies')
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

        $statusOptions = ProposalStatuses::where('deleted', 0)
            ->get()
            ->map(fn($s) => [
                'id'    => $s->id,
                'slug'  => $s->slug,
                'name'  => $s->name,
                'color' => $s->color, 
            ]);

        return Inertia::render('Proposals/Index', [
            'proposals'     => $proposals,
            'filters'       => $request->only(['search', 'proposal_id', 'status']),
            'statusOptions' => $statusOptions,
            'filterData'    => $filterData,
            'summary'       => $summary,
            'lead'          => $lead,
            'auth_permissions' => Auth::user()->getPermissions('PROPOSAL'),
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

                $last = Proposal::withTrashed()
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
                    'created_by'    => Auth::id(),
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

        $proposal = Proposal::where('id', $request->id_proposal)->first();

        return Inertia::render('Proposals/Create', [
            'proposal'  => $proposal,
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
        
                $proposal = Proposal::with('lead.contacts')->where('id', $validated['id'])->first();

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

                $selectedContact = $proposal->lead->contacts ?? null;

                $managers = User::whereHas('role', function($q) {
                    $q->where('name', 'manager'); 
                })->get();
                foreach ($managers as $manager) {
                    $manager->notifications()
                            ->where('data->id', (string)$proposal->id)
                            ->where('data->type', 'proposals')
                            ->delete();

                    $manager->notify(new DocumentNotification([
                        'id'                => $proposal->id,
                        'type'              => 'proposals',
                        'status'            => 'draft',
                        'url'               => "/proposal/{$proposal->proposal_element_template_id}",
                        'message'           => "proposals baru #{$proposal->proposal_number} menunggu persetujuan.",
                        'contact_person'    => $selectedContact->name ?? 'No Name',
                        'email'             => $selectedContact->email ?? null,
                    ]));
                }

                ActivityLogs::create([
                    'user_id' => Auth::id(),
                    'module' => 'Proposal',
                    'action' => 'Created',
                    'description' => 'Create New Proposal: ' . $proposal->proposal_number,
                ]);
                
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

    public function updateStatus(Request $request, Proposal $proposal)
    {

        $status = ProposalStatuses::find($request->proposal_statuses_id);

        if (!$status) {
            return back()->withErrors(['status' => 'Status tidak valid']);
        }

        $proposal->update([
            'proposal_statuses_id'  => $status->id,
            'status'                => strtolower($status->name),
            'updated_by'            => Auth::id(),
        ]);

        ActivityLogs::create([
            'user_id' => auth::id(),
            'module' => 'Proposal',
            'action' => 'Updated',
            'description' => 'Update Proposal Status: ' . $proposal->proposal_number,
        ]);

        return back()->with('message', 'Status updated successfully');
    }

    public function preview($id)
    {

        $data = ProposalElementTemplate::findOrFail($id);

        $proposal = Proposal::where('proposal_element_template_id', $id)->whereNull('opened_at')->first();

        if ($proposal) {
            $status = ProposalStatuses::where('name', 'Opened')->where('deleted', false)->first();

            $proposal->proposal_statuses_id = $status->id;
            $proposal->status               = 'opened';
            $proposal->opened_at            = now();
            $proposal->save();
        }

        return Inertia::render('Proposals/Show', [
            'html' => $data->html_output,
            'css'  => $data->css_output,
        ]);

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

    public function icon()
    {
        $path = storage_path('app/public/icon.json');

        if (!file_exists($path)) {
            return response()->json([], 404);
        }

        return response()->json(
            json_decode(file_get_contents($path), true)
        );

    }

    public function notificationUpdateStatus(Request $request, $id)
    {
        // dd("notif", $request->all(), $id);

        $request->validate([
            'status' => 'required|in:draft,approved,revised,sent,accepted,expired,rejected',
            'revision_note' => 'required_if:status,revised'
        ]);

        $status = ProposalStatuses::where('name', $request->status)->first();

        if (!$status) {
            return back()->withErrors(['status' => 'Status tidak valid']);
        }

        $proposal = Proposal::where('id', $id)->where('deleted', 0)->firstOrFail();

        $managerNotif = Auth::user()->notifications()
        ->where('data->id', $id)
        ->first();

        $capturedContactName  = $managerNotif->data['contact_person'] ?? 'No Name';
        $capturedContactEmail = $managerNotif->data['email'] ?? null;

        $updateData = [
            'status' => $request->status, 
            'proposal_statuses_id' => $status->id,
        ];
        if ($request->status === 'revised') {
            $updateData['revision_note'] = $request->revision_note;
        }

        $proposal->update($updateData);

        auth()->user()->notifications()
            ->where('data->id', $id)
            ->delete();

        $creator = $proposal->creator;

        if($creator) {
            $creator->notifications()
                    ->where('data->id', (string)$id)
                    ->delete();
            $msg = "Proposal #{$proposal->proposal_number} telah di-{$request->status}";

            if ($request->status === 'revised' && $request->revision_note) {
                $msg .= ": " . $request->revision_note;

            }

            // $contactPerson = $quotation->lead->contact_person ?? 'No Name';
            // $contactEmail = $quotation->lead->email ?? null;

            $creator->notify(new DocumentNotification([
                'id'     => $proposal->id,
                'message' => $msg,
                'url' => "/proposal/{$id}",
                'type' => 'proposal',
                'revision_note' => $request->revision_note,
                'status'  => $request->status,
                'contact_person' => $capturedContactName,
                'email'          => $capturedContactEmail,
            ]));
        }

        return back();
    }

}
