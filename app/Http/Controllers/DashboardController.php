<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Project;
use App\Models\User;
use App\Models\Invoice;
use App\Models\ActivityLogs;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // --- DATA UNTUK ROLE ADMIN ---
        // Count akan menghasilkan 0 jika kosong, kita tambahkan ?? 0 hanya untuk kepastian ekstra
        $clientsCount = Company::where('deleted', 0)->count() ?? 0;
        $leadsCount = Lead::where('deleted', 0)->count() ?? 0;
        $usersCount = User::where('deleted', 0)->count() ?? 0;
        $projectsCount = Project::where('deleted', 0)->count() ?? 0;

        // --- DATA UNTUK ROLE MARKETING ---
        $newLeadsCount = Lead::where('deleted', 0)
            ->whereYear('created_at', Carbon::now()->year)
            ->whereMonth('created_at', Carbon::now()->month)
            ->count() ?? 0;

        $convertedLeadsCount = Lead::where('deleted', 0)
            ->whereHas('status', function ($query) {
                $query->where('name', 'sent')
                    ->where('deleted', 0);
            })
            ->count() ?? 0;

        // --- DATA UNTUK ROLE FINANCE ---
        $totalInvoice = Invoice::where('deleted', 0)->count() ?? 0;
        
        $paidCount = Invoice::where('deleted', 0)
            ->where('status', 'Paid')
            ->count() ?? 0;
            
        $unpaidCount = Invoice::where('deleted', 0)
            ->where('status', 'Unpaid')
            ->count() ?? 0;

        $recentInvoices = Invoice::where('deleted', 0)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($inv) {
                return [
                    'id'             => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'amount'         => $inv->invoice_amout ?? 0, // Mengikuti typo di DB: invoice_amout
                    'status'         => $inv->status, // Enum: 'Draft', 'Paid', 'Invoice', 'Unpaid', 'Partial'
                    'due_date'       => $inv->date,
                ];
            });

        $totalRevenue = Invoice::where('deleted', 0)
            ->where('status', 'Paid') 
            ->sum('invoice_amout') ?? 0;

        $recentActivities = ActivityLogs::with('user')
        ->latest()
        ->take(5)
        ->get()
        ->map(function ($log) {
            return [
                'date'   => $log->created_at->diffForHumans(), // Contoh: "2 hours ago"
                'user'   => $log->user->name ?? 'System',
                'action' => "[{$log->module}] {$log->description}",
            ];
        });

        $recentLeads = Lead::with('status')
        ->where('deleted', 0)
        ->latest()
        ->take(5)
        ->get()
        ->map(function ($lead) {
            return [
                'id'             => $lead->id,
                'company_name'   => $lead->company_name,
                'contact_person' => $lead->contact_person,
                'status_name'    => $lead->status->name ?? 'N/A',
                'status_color'   => $lead->status->color_name ?? 'gray', 
            ];
        });

        return Inertia::render('Dashboard', [
            'Clients'      => $clientsCount,
            'Leads'        => $leadsCount,
            'Users'        => $usersCount,
            'Projects'     => $projectsCount,
            'NewLeads'     => $newLeadsCount,
            'Converted'    => $convertedLeadsCount,
            'TotalInvoice' => $totalInvoice,
            'PaidCount'    => $paidCount,
            'UnpaidCount'  => $unpaidCount,
            'Revenue'      => $totalRevenue,
            'RecentInvoices' => $recentInvoices,
            'RecentActivities' => $recentActivities,
            'RecentLeads'      => $recentLeads,
        ]);
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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
