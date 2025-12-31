<?php

namespace App\Http\Controllers\Quotation;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Lead;
use App\Models\User;
use App\Models\Company;
use App\Notifications\DocumentNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class QuotationController extends Controller {
    public function index(Request $request) {
        // SYNC: Update status di database sebelum melakukan perhitungan apapun
        Quotation::syncExpiredStatus();

        // Summary (Sekarang data 'expired' sudah terhitung dengan benar oleh database)
        $summary = Quotation::select('status', DB::raw('count(*) as count'))
            ->where('deleted', 0)
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Totals per status
        $totals = Quotation::select('status', DB::raw('SUM(total) as total_amount'))
            ->where('deleted', 0)
            ->groupBy('status')
            ->get()
            ->pluck('total_amount', 'status')
            ->toArray();

        $years = Quotation::select(DB::raw('YEAR(date) as year'))
            ->where('deleted', 0)
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->filter()
            ->values();

        $query = Quotation::with(['lead', 'creator'])->where('deleted', 0);

        // Filter Search
        $query->when($request->input('search'), function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('subject', 'like', "%{$search}%")
                    ->orWhere('quotation_number', 'like', "%{$search}%")
                    ->orWhereHas('lead', function ($leadQuery) use ($search) {
                        $leadQuery->where('company_name', 'like', "%{$search}%");
                    });
            });
        });

        // Filter Status (Sudah otomatis mendukung 'expired' karena sudah di-update di DB)
        $query->when($request->input('status') && $request->input('status') !== 'all', function ($q) use ($request) {
            $q->where('status', $request->input('status'));
        });

        // Filter Month
        $query->when($request->input('month'), function ($q, $month) {
            $q->whereMonth('date', $month);
        });

        // Filter Year
        $query->when($request->input('year'), function ($q, $year) {
            $q->whereYear('date', $year);
        });

        // Pagination
        $quotations = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($quotation) {
                $quotation->is_client = \DB::table('companies')
                    ->where('lead_id', $quotation->lead_id)
                    ->exists();
                    
                return $quotation;
            })
            ->withQueryString();

        return Inertia::render('Quotations/Index', [
            'quotations' => $quotations,
            'filters'    => $request->only(['search', 'status', 'month', 'year']),
            'statusOptions' => [
                ['value' => 'sent', 'label' => 'Sent'],
                ['value' => 'accepted', 'label' => 'Accepted'],
                ['value' => 'expired', 'label' => 'Expired'],
                ['value' => 'rejected', 'label' => 'Rejected'],
            ],
            'summary'    => $summary,
            'years'      => $years,
            'totals'     => $totals,
        ]);
    }

    public function create() {
        $nextNumber = Quotation::count() + 1;
        $existingLeadIds = Company::where('deleted', 0)
            ->whereNotNull('lead_id')
            ->pluck('lead_id');
        $availableLeads = Lead::where('deleted', 0)
            ->whereNotIn('id', $existingLeadIds)
            ->select(['id', 'company_name', 'address', 'contact_person', 'email', 'phone'])
            ->get();
        $companies = Company::where('deleted', 0)->with(['quotation', 'contacts' => function($query) {$query->where('deleted', 0);}, 'contactPersons.lead', 'lead'])->get();
        
        return Inertia::render('Quotations/Create', [
            'companies' => $companies,
            'leads' => $availableLeads,
            'nextNumber' => $nextNumber
        ]);
    }

    public function store(Request $request) 
    {
        // dd($request);

        if ($request->has('services') && is_string($request->services)) {
            $decoded = json_decode($request->services, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['services' => $decoded]);
            }
        }

        $validated = $request->validate([
            'client_type'     => 'required|string',
            'company_id'      => 'required', 
            'number'          => 'required|',
            'date'            => 'required|date',
            'valid_until'     => 'nullable|date',
            'subject'         => 'required|string',
            'payment_terms'   => 'nullable|string',
            'note'            => 'nullable|string',
            'sub_total'       => 'required|numeric',
            'discount_amount' => 'nullable|numeric',
            'tax_amount'      => 'nullable|numeric',
            'total'           => 'required|numeric',
            'pdf_file'        => 'required|mimes:pdf|max:5120',
            'services'        => 'required|array|min:1',
        ]);

        try {
            return DB::transaction(function () use ($request, $validated) {
                $path = $request->file('pdf_file')->store('quotations', 'public');
                $leadId = null;

                if ($validated['client_type'] === 'Client') {
                    $company = Company::find($validated['company_id']);
                    
                if (!$company) {
                    throw new \Exception("Data Client tidak ditemukan.");
                }
                    $leadId = $company->lead_id; 
                } else {
                    $leadId = $validated['company_id'];
                }

                $quotation = Quotation::create([
                    'lead_id'          => $leadId,
                    'quotation_number' => $validated['number'], 
                    'date'             => $validated['date'],
                    'valid_until'      => $validated['valid_until'],
                    'status'           => 'draft',
                    'subject'          => $validated['subject'],
                    'payment_terms'    => $validated['payment_terms'],
                    'note'             => $validated['note'],
                    'pdf_path'         => $path,
                    'discount'         => $validated['discount_amount'] ?? 0,
                    'sub_total'        => $validated['sub_total'] ?? 0,
                    'tax'              => $validated['tax_amount'] ?? 0,
                    'total'            => $validated['total'],
                    'created_by'       => auth()->id(),
                ]);

                foreach ($validated['services'] as $item) {
                    QuotationItem::create([
                        'quotation_id'  => $quotation->id,
                        'name'          => $item['name'],
                        'amount'        => $item['price'],
                        'processing'    => $item['processing'] ?? null,
                        'created_by'    => auth()->id(),
                    ]);
                }

                $managers = User::whereHas('role', function($q) {
                    $q->where('name', 'manager'); 
                })->get();
                foreach ($managers as $manager) {
                    $manager->notifications()
                            ->where('data->id', (string)$quotation->id)
                            ->where('data->type', 'quotation')
                            ->delete();

                    $manager->notify(new DocumentNotification([
                        'id'               => $quotation->id,
                        'type'             => 'quotation',
                        'status'           => 'draft',
                        'url'              => "/storage/quotations/{$quotation->id}",
                        'message'          => "Quotation baru #{$quotation->quotation_number} menunggu persetujuan.",
                    ]));
                }

                return redirect()->route('quotation.index')->with('success', 'Quotation berhasil disimpan!');
            });
        } catch (\Exception $e) {
            if (isset($path)) Storage::disk('public')->delete($path);
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }
    }

    public function updateStatus(Request $request, Quotation $quotation)
    {
        $request->validate([
            'status' => 'required|in:draft,sent,accepted,expired,rejected'
        ]);

        $quotation->update([
            'status' => $request->status,
            'updated_by' => auth()->id(),
        ]);

        return back()->with('message', 'Status updated successfully');
    }

    public function edit(Quotation $quotation)
    {
        $existingLeadIds = Company::where('deleted', 0)
            ->whereNotNull('lead_id')
            ->pluck('lead_id');

        $availableLeads = Lead::where('deleted', 0)
            ->whereNotIn('id', $existingLeadIds)
            ->select(['id', 'company_name', 'address', 'contact_person', 'email', 'phone'])
            ->get();

        $companies = Company::where('deleted', 0)
            ->with([
                'quotation', 
                'contactPersons' => function($query) {
                    $query->where('deleted', 0);
                }, 
                'contactPersons.lead', 
                'lead'
            ])->get();

            
        $quotation->load(['items', 'lead']);

        $isClient = $existingLeadIds->contains($quotation->lead_id);

        $quotation->is_client = @ $isClient;

        return Inertia::render('Quotations/Edit', [
            'quotation'  => $quotation,
            'companies'  => $companies,
            'leads'      => $availableLeads,
        ]);
    }
    /**
     * Memproses update data Quotation dan Services-nya.
     */
    public function update(Request $request, Quotation $quotation)
    {
        if ($request->has('services')) {
            $decodedServices = is_string($request->services) 
                ? json_decode($request->services, true) 
                : $request->services;

            $request->merge(['services' => $decodedServices]);
        }
        
        $validated = $request->validate([
            'client_type'     => 'required|string',
            'company_id'      => 'required', 
            'contact_person'  => 'required|string',
            'email'           => 'nullable|email',
            'phone'           => 'nullable',
            'number'          => 'required',
            'date'            => 'required|date',
            'valid_until'     => 'nullable|date',
            'subject'         => 'required|string',
            'payment_terms'   => 'nullable|string',
            'note'            => 'nullable|string',
            'sub_total'       => 'required|numeric',
            'discount_amount' => 'nullable|numeric',
            'tax_amount'      => 'nullable|numeric',
            'total'           => 'required|numeric',
            'pdf_file'        => 'nullable|mimes:pdf|max:5120', 
            'services'        => 'required|array|min:1',
            'services.*.name' => 'required|string',
            'services.*.price' => 'required|numeric',
            'services.*.processing' => 'required|string'
        ]);

        try {
            DB::beginTransaction();

            $path = $quotation->pdf_path;
            if ($request->hasFile('pdf_file')) {
                if ($path && \Storage::disk('public')->exists($path)) {
                    \Storage::disk('public')->delete($path);
                }
                $path = $request->file('pdf_file')->store('quotations', 'public');
            }

            $leadId = null;

            if ($validated['client_type'] === 'Client') {
                $company = Company::find($validated['company_id']);
                
            if (!$company) {
                throw new \Exception("Data Client tidak ditemukan.");
            }
                $leadId = $company->lead_id; 
            } else {
                $leadId = $validated['company_id'];
            }

            $quotation->update([
                'lead_id'       => $leadId, 
                'date'          => $validated['date'],
                'valid_until'   => $validated['valid_until'],
                'subject'       => $validated['subject'],
                'payment_terms' => $validated['payment_terms'],
                'note'          => $validated['note'],
                'status'        => 'draft',
                'pdf_path'      => $path,
                'discount'      => $validated['discount_amount'] ?? 0,
                'sub_total'     => $validated['sub_total'] ?? 0,
                'tax'           => $validated['tax_amount'] ?? 0,
                'total'         => $validated['total'],
                'updated_by'    => auth()->id(),
            ]);

            // Hapus yang lama, masukkan yang baru
            $quotation->items()->delete(); 

            foreach ($validated['services'] as $item) {
                $quotation->items()->create([
                    'name'       => $item['service_name'] ?? $item['name'], 
                    'amount'     => $item['price'] ?? $item['amount'],
                    'processing' => $item['processing'],
                    'created_by' => auth()->id(), // Opsional: atau pakai updated_by
                ]);
            }

            auth()->user()->notifications()
                ->where('data->id', $quotation->id)
                ->delete();

            $managers = User::whereHas('role', function($q) {
                $q->where('name', 'manager');
            })->get();

            foreach ($managers as $manager) {
                $manager->notifications()
                        ->where('data->id', (string)$quotation->id)
                        ->where('data->type', 'quotation')
                        ->delete();

                $manager->notify(new DocumentNotification([
                    'id'               => $quotation->id,
                    'type'             => 'quotation',
                    'status'           => 'draft',
                    'url'              => "/storage/{$quotation->pdf_path}",
                    'message'          => "Quotation #{$quotation->quotation_number} telah diperbarui dan siap di-review ulang.",
                ]));
            }

            DB::commit();

            return redirect()->route('quotation.index')
                ->with('message', 'Quotation updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Quotation Update Error: " . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Quotation $quotation) 
    {
        if ($quotation->deleted == 1) {
            return redirect()->route('quotation.index')
                ->with('error', 'Project already deleted.');
        }

        $user = Auth::user();
        
        $quotation->deleted_by = $user->id;
        $quotation->deleted = 1;
        $quotation->deleted_at = now();
        $quotation->save();

        return redirect()->route('quotation.index')
            ->with('success', 'Project deleted successfully!');
    }   

    public function notificationUpdateStatus(Request $request, $id) 
    {
        // dd("notif", $request->all());

        $request->validate([
            'status' => 'required|in:draft,approved,revised,sent,accepted,expired,rejected',
            'revision_note' => 'required_if:status,revised'
        ]);

        $quotation = Quotation::where('id', $id)->where('deleted', 0)->firstOrFail();

        $updateData = ['status' => $request->status];
        if ($request->status === 'revised') {
            $updateData['revision_note'] = $request->revision_note;
        }

        $quotation->update($updateData);

        auth()->user()->notifications()
            ->where('data->id', $id)
            ->delete();

        $creator = $quotation->creator;

        if($creator) {
            $creator->notifications()
                    ->where('data->id', (string)$id)
                    ->delete();
            $msg = "Quotation #{$quotation->quotation_number} telah di-{$request->status}";

            if ($request->status === 'revised' && $request->revision_note) {
                $msg .= ": " . $request->revision_note;

            }
            $creator->notify(new DocumentNotification([
                'id'     => $quotation->id,
                'message' => $msg,
                'url' => "/quotations/edit/{$id}",
                'type' => 'quotation',
                'revision_note' => $request->revision_note,
                'status'  => $request->status,
            ]));
        }

        return back();
    }

    public function markAllRead()
    {
        auth()->user()->unreadNotifications->markAsRead();
        return back();
    }

    public function markAsSent($id)
    {
        $quotation = Quotation::findOrFail($id);
        $quotation->update(['status' => 'sent']);

        // Hapus notifikasi di lonceng Staff karena sudah dikirim ke client
        auth()->user()->notifications()
            ->where('data->id', (string)$id)
            ->where('data->type', 'quotation')
            ->delete();

        return back()->with('success', 'Quotation marked as sent and notification cleared.');
    }
}