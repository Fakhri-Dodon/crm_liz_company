<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Roles;
use App\Models\EmailLogs;
use App\Models\AppConfig;
use App\Models\MenuMapping;
use App\Models\LeadStatuses;
use App\Models\MailSettings;
use App\Models\EmailTemplates;
use App\Models\ProposalStatuses;
use App\Models\ProposalNumberFormatted;
use App\Models\ProposalElementTemplate;
use App\Models\QuotationStatuses;
use App\Models\QuotationNumberFormated;
use App\Models\ActivityLogs;
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

        $config->update($request->all());

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'General Setting',
            'action' => 'Update',
            'description' => 'Update General Settings',
        ]);

        return back()->with('success', 'Settings updated successfully');
    }

    public function general()
    {
        return Inertia::render('Settings/General', [
            'config' => AppConfig::where('deleted', 0)->first()
        ]);
    }

     public function userRoles()
    {
        return Inertia::render('Settings/UserRoles', [
            'roles' => Roles::orderBy('name', 'asc')->get(),
            'menus' => Menu::orderBy('name', 'asc')->get(),
            'rawPermissions' => MenuMapping::all(),
        ]);
    }

    public function userRolesStore(Request $request)
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'menu_id' => 'required|exists:menu,id',
            'can_create' => 'required|integer',
            'can_read' => 'required|integer',
            'can_update' => 'required|integer',
            'can_delete' => 'required|integer',
        ]);

        MenuMapping::create($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Roles Setting',
            'action' => 'Created',
            'description' => 'Create New Role',
        ]);

        return redirect()->back();
    }

    public function userRolesUpdate(Request $request, $id)
    {
        $permission = MenuMapping::findOrFail($id);
        
        $validated = $request->validate([
            'can_create' => 'required|integer',
            'can_read' => 'required|integer',
            'can_update' => 'required|integer',
            'can_delete' => 'required|integer',
        ]);

        $permission->update($validated);

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Roles Setting',
            'action' => 'Update',
            'description' => 'Update Role',
        ]);

        return redirect()->back();
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
        $config     = AppConfig::where('deleted', 0)->first();
        
        $numbering  = ProposalNumberFormatted::where('deleted', 0)->first();
        
        $statuses   = ProposalStatuses::where('deleted', 0)->orderBy('order', 'asc')->get();
        
        $templates  = ProposalElementTemplate::limit(4)
            ->whereNotNull('html_output')
            ->whereNotNull('css_output')
            // ->where('created_by', Auth::id())
            ->get();

        return Inertia::render('Settings/Proposals', [
            'config'    => $config,
            'numbering' => $numbering,
            'statuses'  => $statuses,
            'templates' => $templates
        ]);
    }

    public function quotations()
    {
        $config     = AppConfig::where('deleted', 0)->first();
        
        $numbering  = QuotationNumberFormated::where('deleted', 0)->first();
        
        $statuses   = QuotationStatuses::where('deleted', 0)->orderBy('order', 'asc')->get();

        return Inertia::render('Settings/Quotations', [
            'config'    => $config,
            'numbering' => $numbering,
            'statuses'  => $statuses,
        ]);
    }

    public function email()
    {
        return Inertia::render('Settings/Emails', [
            'mails' => MailSettings::where('deleted', 0)->first(),
            'templates' => EmailTemplates::where('deleted', 0)->get(),
            'emailLogs' => EmailLogs::where('deleted', 0)->get(),
        ]);
    }
}