<?php

namespace App\Http\Controllers\Quotation;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplates;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Lead;
use App\Models\User;
use App\Models\QuotationStatuses;
use App\Models\QuotationNumberFormated;
use App\Models\Company;
use App\Models\ActivityLogs;
use App\Models\Ppn;
use App\Notifications\DocumentNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use App\Mail\SystemMail;
use Illuminate\Support\Facades\Mail;

class QuotationController extends Controller {
    public function index(Request $request) {
        $expiredStatus = QuotationStatuses::where('name', 'Expired')->first();
        // SYNC: Update status di database sebelum melakukan perhitungan apapun
        Quotation::where('deleted', 0)
            ->whereNotIn('status', ['accepted', 'rejected', 'expired'])
            ->whereNotNull('valid_until')
            ->where('valid_until', '<', now()->startOfDay())
            ->update([
                'status' => 'expired',
                'quotation_statuses_id' => $expiredStatus ? $expiredStatus->id : null
            ]);
            
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

        $query = Quotation::with(['lead', 'creator', 'companyContactPerson', 'statusRel'])->where('deleted', 0);

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
            $q->where('quotation_statuses_id', $request->input('status'));
        });

        // Filter Month
        $query->when($request->input('month'), function ($q, $month) {
            $q->whereMonth('date', $month);
        });

        // Filter Year
        $query->when($request->input('year'), function ($q, $year) {
            $q->whereYear('date', $year);
        });

        // status
        $statusOptions = QuotationStatuses::where('deleted', 0)
        ->get()
        ->map(fn($s) => [
            'id'    => $s->id,
            'slug'  => $s->slug,
            'name'  => $s->name,
            'color' => $s->color, 
        ]);

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
            'statusOptions' => $statusOptions,
            'summary'    => $summary,
            'years'      => $years,
            'totals'     => $totals,
            'auth_permissions' => auth()->user()->getPermissions('QUOTATION'),
        ]);
    }

    public function create() {
        $setting = QuotationNumberFormated::where('deleted', 0)->first();
        $nextNumberPreview = "Config Missing";

        if ($setting) {
            $totalExisting = Quotation::where('deleted', 0)->count();
    
            $currentNumber = $totalExisting + 1;

            if ($setting->next_number > $currentNumber) {
                $currentNumber = $setting->next_number;
            }

            $nextNumberPreview = $setting->prefix . str_pad($currentNumber, $setting->padding, '0', STR_PAD_LEFT);
        }

        // $nextNumber = Quotation::count() + 1;
        $existingLeadIds = Company::where('deleted', 0)
            ->whereNotNull('lead_id')
            ->pluck('lead_id');
        $availableLeads = Lead::where('deleted', 0)
            ->whereNotIn('id', $existingLeadIds)
            ->with(['contacts' => function($q) {
                $q->where('deleted', 0);
            }])
            ->get();
        $companies = Company::where('deleted', 0)
            ->with(['lead', 'contacts' => function($q) {
                $q->where('deleted', 0);
            }])
            ->get();
        
        $ppn = Ppn::where('deleted', 0)->get();
        
        return Inertia::render('Quotations/Create', [
            'companies' => $companies,
            'leads' => $availableLeads,
            'nextNumber' => $nextNumberPreview,
            'ppn'   => $ppn,
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
            'company_contact_person_id'      => 'required', 
            'number'          => 'nullable',
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
                
                $setting = QuotationNumberFormated::where('deleted', 0)->first();
                if (!$setting) {
                    throw new \Exception("Format nomor quotation belum dikonfigurasi.");
                }

                $statusEntry = QuotationStatuses::where('name', 'draft')->where('deleted', 0)->first();
                if (!$statusEntry) {
                    throw new \Exception("Status 'draft' tidak ditemukan di tabel referensi status.");
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

                $quotation = Quotation::create([
                    'lead_id'          => $leadId,
                    'company_contact_person_id'    => $validated['company_contact_person_id'],
                    'quotation_number_formated_id' => $setting->id,
                    'quotation_statuses_id'        => $statusEntry->id,
                    'quotation_number' => $validated['number'], 
                    'date'             => $validated['date'],
                    'valid_until'      => $validated['valid_until'],
                    'status'           => 'draft',
                    'subject'          => $validated['subject'],
                    'payment_terms'    => $validated['payment_terms'],
                    'note'             => $validated['note'],
                    'pdf_path'         => $path,
                    'discount'         => $validated['discount_amount'] ?? 0,
                    'subtotal'        => $validated['sub_total'] ?? 0,
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

                $selectedContact = \App\Models\CompanyContactPerson::find($request->company_contact_person_id);

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
                        'actionUrl'        => null,
                        'message'          => "Quotation baru #{$quotation->quotation_number} menunggu persetujuan.",
                        'contact_person'   => $selectedContact->name ?? 'No Name',
                        'email'            => $selectedContact->email ?? null,
                    ]));
                }

                ActivityLogs::create([
                    'user_id' => auth()->id(),
                    'module' => 'Quotations',
                    'action' => 'Created',
                    'description' => 'Create New Quotation: ' . $quotation->quotation_number,
                ]);

                return redirect()->route('quotation.index')->with('success', 'Quotation berhasil disimpan!');
            });
        } catch (\Exception $e) {
            if (isset($path)) Storage::disk('public')->delete($path);
            return back()->withErrors(['error' => 'Gagal Simpan: ' . $e->getMessage()]);
        }
    }

    public function updateStatus(Request $request, Quotation $quotation)
    {
        // $request->validate([
        //     'status' => 'required'
        // ]);

        $status = QuotationStatuses::find($request->quotation_statuses_id);

        if (!$status) {
            return back()->withErrors(['status' => 'Status tidak valid']);
        }

        $quotation->update([
            // 'status' => $request->status,
            'quotation_statuses_id' => $status->id,
            'updated_by' => auth()->id(),
        ]);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Quotations',
            'action' => 'Updated',
            'description' => 'Update Quotation Status: ' . $quotation->quotation_number,
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
            ->with(['contacts' => function($q) {
                $q->where('deleted', 0);
            }])
            ->get();

        // PERBAIKAN: Gunakan 'contacts' bukan 'contactPersons'
        $companies = Company::where('deleted', 0)
            ->with([
                'quotation', 
                'contacts' => function($query) {
                    $query->where('deleted', 0);
                }, 
                'lead'
            ])->get();

        // Load data quotation dengan relationships yang benar
        $quotation->load(['items', 'lead', 'company', 'company.contacts', 'creator.role', 'companyContactPerson']);
        
        $isClient = false;
        if ($quotation->company) {
            // Cek apakah company ini memiliki lead_id yang sama dengan quotation
            $isClient = Company::where('deleted', 0)
                ->where('lead_id', $quotation->lead_id)
                ->exists();
        }

        $quotation->is_client = $isClient;

        $ppn = Ppn::where('deleted', 0)->get();

        return Inertia::render('Quotations/Edit', [
            'quotation'  => $quotation,
            'companies'  => $companies,
            'leads'      => $availableLeads,
            'ppn'        => $ppn
        ]);
    }

    /**
     * Memproses update data Quotation dan Services-nya.
     */
    public function update(Request $request, Quotation $quotation)
    {
        // dd($request->all());
        if ($request->has('services')) {
            $decodedServices = is_string($request->services) 
                ? json_decode($request->services, true) 
                : $request->services;

            $request->merge(['services' => $decodedServices]);
        }
        
        $validated = $request->validate([
            'client_type'     => 'required|string',
            'company_id'      => 'required', 
            'company_contact_person_id' => 'nullable',
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

            $setting = QuotationNumberFormated::where('deleted', 0)->first();
            if (!$setting) {
                throw new \Exception("Format nomor quotation belum dikonfigurasi.");
            }

            $statusEntry = QuotationStatuses::where('name', 'draft')->where('deleted', 0)->first();
            if (!$statusEntry) {
                throw new \Exception("Status 'draft' tidak ditemukan di tabel referensi status.");
            }

            $leadId = null;
           if ($validated['client_type'] === 'Client') {
                $company = Company::find($validated['company_id']);
                $leadId = $company ? $company->lead_id : null;
            } else {
                $leadId = $validated['company_id'];
            }

            $quotation->update([
                'lead_id'       => $leadId, 
                'company_contact_person_id'    => $validated['company_contact_person_id'],
                'quotation_number_formated_id' => $setting->id,
                'quotation_statuses_id'        => $statusEntry->id,
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

            $selectedContact = \App\Models\CompanyContactPerson::find($request->company_contact_person_id);

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
                    'actionUrl'        => null,
                    'message'          => "Quotation #{$quotation->quotation_number} telah diperbarui dan siap di-review ulang.",
                    'contact_person'   => $selectedContact->name ?? 'No Name',
                    'email'            => $selectedContact->email ?? null,
                ]));
            }

            ActivityLogs::create([
                'user_id' => auth()->id(),
                'module' => 'Quotations',
                'action' => 'Updated',
                'description' => 'Update Quotation: ' . $quotation->quotation_number,
            ]);

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
        try {
            // Cek apakah quotation sudah dihapus
            if ($quotation->deleted == 1) {
                return redirect()->route('quotation.index')
                    ->with('error', 'Quotation sudah dihapus sebelumnya.');
            }

            $user = Auth::user();
            
            // Lakukan soft delete
            $quotation->update([
                'deleted' => 1,
                'deleted_by' => $user->id,
                'deleted_at' => now(),
                'updated_by' => $user->id,
            ]);

            // Hapus juga quotation items terkait (soft delete)
            QuotationItem::where('quotation_id', $quotation->id)
                ->update([
                    'deleted' => 1,
                    'deleted_by' => $user->id,
                    'deleted_at' => now(),
                ]);

            // Hapus notifikasi terkait quotation ini
            DB::table('notifications')
                ->where('data->id', (string)$quotation->id)
                ->where('data->type', 'quotation')
                ->delete();

            ActivityLogs::create([
                'user_id' => auth()->id(),
                'module' => 'Quotations',
                'action' => 'Deleted',
                'description' => 'Delete Quotation: ' . $quotation->quotation_number,
            ]);

            return redirect()->route('quotation.index')
                ->with('success', 'Quotation berhasil dihapus!');

        } catch (\Exception $e) {
            \Log::error('Error deleting quotation: ' . $e->getMessage());
            return redirect()->route('quotation.index')
                ->with('error', 'Gagal menghapus quotation: ' . $e->getMessage());
        }
    }

    public function notificationUpdateStatus(Request $request, $id) 
    {
        // dd("notif", $request->all(), $id);

        $request->validate([
            'status' => 'required|in:draft,approved,revised,sent,accepted,expired,rejected',
            'revision_note' => 'required_if:status,revised'
        ]);

        $status = QuotationStatuses::where('name', $request->status)->first();

        if (!$status) {
            return back()->withErrors(['status' => 'Status tidak valid']);
        }

        $quotation = Quotation::where('id', $id)->where('deleted', 0)->firstOrFail();

        $managerNotif = auth()->user()->notifications()
        ->where('data->id', $id)
        ->first();

        $capturedContactName  = $managerNotif->data['contact_person'] ?? 'No Name';
        $capturedContactEmail = $managerNotif->data['email'] ?? null;

        $updateData = [
            'status' => $request->status, 
            'quotation_statuses_id' => $status->id,
        ];
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

            // $contactPerson = $quotation->lead->contact_person ?? 'No Name';
            // $contactEmail = $quotation->lead->email ?? null;

            $creator->notify(new DocumentNotification([
                'id'     => $quotation->id,
                'message' => $msg,
                'url' => "/quotations/edit/{$id}",
                'type' => 'quotation',
                'revision_note' => $request->revision_note,
                'status'  => $request->status,
                'contact_person' => $capturedContactName,
                'email'          => $capturedContactEmail,
            ]));
        }

        return back();
    }

    public function markAllRead()
    {
        auth()->user()->unreadNotifications->markAsRead();
        return back();
    }

    // public function markAsSent($id)
    // {
    //     $quotation = Quotation::findOrFail($id);
    //     $quotation->update(['status' => 'sent']);

    //     auth()->user()->notifications()
    //         ->where('data->id', (string)$id)
    //         ->where('data->type', 'quotation')
    //         ->delete();

    //     return back()->with('success', 'Quotation marked as sent and notification cleared.');
    // }

    public function markAsSent(Request $request, $id)
    {
        // 1. Validasi input: template_id dan type dokumen (quotation, invoice, proposal)
        $request->validate([
            'template_id' => 'required|exists:email_templates,id',
            'type'        => 'required|in:quotation,invoice,proposal' 
        ]);

        try {
            // 2. Mapping Model secara dinamis
            $docType = $request->type;
            $modelMap = [
                'quotation' => \App\Models\Quotation::class,
                'invoice'   => \App\Models\Invoice::class,   // Ganti sesuai nama model invoice lo
                'proposal'  => \App\Models\Proposal::class, 
            ];

            $model = $modelMap[$docType];

            // Load data beserta relasi lead
            if($request->type === 'invoice') {
                $document = $model::with(['contactPerson'])->findOrFail($id);
            }else {
                $document = $model::with(['lead'])->findOrFail($id);
            }
            $template = EmailTemplates::findOrFail($request->template_id);

            if ($docType === 'proposal') {
                $actionUrl = url('/proposal/' . $document->proposal_element_template_id);
            }

            // 3. Tentukan Link & Attachment secara dinamis
            $filePath = null;
            $link = '#';
            $actionUrl = null;

            if ($docType === 'proposal') {
                $link = url("/proposal/" . $document->slug); // Sesuaikan route
            } else {
                $filePath = $document->pdf_path;
                $link = asset('storage/' . $filePath);
            }

            // 4. Mapping Placeholder Dinamis
            $placeholders = [
                '{name}'    => $document->lead?->contact_person 
                            ?? $document->contactPerson?->name 
                            ?? '-',
                            
                '{company}' => $document->lead?->company_name 
                            ?? $document->company?->lead?->company_name 
                            ?? '-',
                '{id}'      => $document->quotation_number ?? $document->invoice_number ?? $document->proposal_number ?? '-',
                '{total}'   => number_format($document->total ?? 0, 0, ',', '.'),
                '{link}'    => '<a href="'.$link.'" target="_blank" style="color: #3182ce; font-weight: bold;">Klik di Sini</a>',
            ];

            $finalSubject = str_replace(array_keys($placeholders), array_values($placeholders), $template->subject);
            $finalContent = str_replace(array_keys($placeholders), array_values($placeholders), $template->content);

            // 5. Validasi Email Penerima
            $recipientEmail = $document->lead?->email 
                              ?? $document->contactPerson?->email 
                              ?? $document->company?->email 
                              ?? null;
            if (!$recipientEmail) {
                return back()->with('error', 'Gagal: Email tujuan tidak ditemukan.');
            }

            // 6. Kirim Email (Gunakan constructor ke-3 untuk file)
            \Illuminate\Support\Facades\Mail::to($recipientEmail)
                ->send(new \App\Mail\SystemMail($finalSubject, $finalContent, $filePath, $actionUrl));

            // 7. Update Status & Hapus Notifikasi
            $document->update(['status' => 'sent']);

            auth()->user()->notifications()
                ->where('data->id', (string)$id)
                ->where('data->type', $docType)
                ->delete();

            ActivityLogs::create([
                'user_id' => auth()->id(),
                'module' => $docType,
                'action' => 'Send',
                'description' => 'Send ' . $docType,
            ]);

            \App\Models\EmailLogs::create([
                'to' => $document->lead?->contact_person 
                            ?? $document->contactPerson?->name 
                            ?? '-',
                'subject' => $finalSubject,
                'body' => $finalContent,
                'status' => 'success',
                'sent_date' => now(),
            ]);

            return back()->with('success', ucfirst($docType) . ' berhasil dikirim!');

        } catch (\Exception $e) {
            \Log::error("Gagal kirim {$request->type}: " . $e->getMessage());
            \App\Models\EmailLogs::create([
                'to' => $document->lead?->contact_person 
                            ?? $document->contactPerson?->name 
                            ?? '-',
                'subject' => 'FAILED: Uji Coba SMTP',
                'body' => $e->getMessage(),
                'status' => 'failed',
                'sent_date' => now(),
            ]);
            return back()->with('error', 'Gagal mengirim email: ' . $e->getMessage());
        }
    }
}