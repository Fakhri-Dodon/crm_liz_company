<?php

namespace App\Http\Controllers;

use App\Models\MenuMapping;
use App\Models\Menu;
use App\Models\AppConfig;
use App\Models\LeadStatuses;
use App\Models\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Method Tunggal untuk Update Switch (Lead & Proposal)
     */
    public function updateGeneral(Request $request)
    {
        $config = AppConfig::where('deleted', 0)->first();

        if (!$config) {
            return back()->with('error', 'Configuration not found');
        }

        // Update dinamis untuk lead_... atau proposal_...
        $config->update($request->all());

        return back()->with('success', 'Settings updated successfully');
    }

    public function general()
    {
        return Inertia::render('Settings/General', [
            'config' => AppConfig::where('deleted', 0)->first()
        ]);
    }

    /**
     * Menampilkan halaman pengaturan Role
     */
     public function userRoles()
    {
        return Inertia::render('Settings/UserRoles');
    }

    public function leads()
    {
        return Inertia::render('Settings/Leads', [
            'config' => AppConfig::where('deleted', 0)->first(),
            'statuses' => LeadStatuses::where('deleted', 0)
                ->with('creator:id,name') 
                ->orderBy('order', 'asc')
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'note' => $s->note,
                    'color' => $s->color,
                    'color_name' => $s->color_name,
                    'is_system' => $s->is_system,
                    'created_by' => $s->created_by,
                    'creator' => $s->creator ? [
                        'id' => $s->creator->id,
                        'name' => $s->creator->name,
                    ] : null,
                ]),
        ]);
    }

    public function proposals()
    {
        return Inertia::render('Settings/Proposals', [
            'config' => AppConfig::where('deleted', 0)->first(),
            'statuses' => [] // Isi jika model ProposalStatus sudah ada
        ]);
    }

    public function email()
    {
        return Inertia::render('Settings/Emails');
    }
}