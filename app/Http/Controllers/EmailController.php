<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmailTemplates;
use App\Models\ActivityLogs;

class EmailController extends Controller
{
    public function index()
    {
        return inertia('Email/Index', [
            'templates' => EmailTemplates::where('deleted', 0)->get(),
            'auth_permissions' => auth()->user()->getPermissions('EMAIL'),
        ]);
    }

    public function store(Request $request)
    {
        $attr = $request->validate([
            'name' => 'required',
            'subject' => 'required',
            'content' => 'required',
        ]);

        $attr['content'] = trim($attr['content']);

        EmailTemplates::create(array_merge($attr, [
            'id' => \Illuminate\Support\Str::uuid()
        ]));

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Email',
            'action' => 'Created',
            'description' => 'Create New Email Template',
        ]);

        return back();
    }

    public function update(Request $request, $id)
    {
        $template = EmailTemplates::findOrFail($id);
        
        $attr = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $template->update($attr);
        
        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Email',
            'action' => 'Update',
            'description' => 'Update Email Template',
        ]);

        return back();
    }

    public function destroy($id)
    {
        $template = EmailTemplates::findOrFail($id);
        $template->delete();

        ActivityLogs::create([
            'user_id' => auth()->id(),
            'module' => 'Email',
            'action' => 'Deleted',
            'description' => 'Delete Email Template',
        ]);

        return back();
    }

    public function sendDocument($type, $id)
    {
        $doc = ($type === 'quotation') ? Quotation::findOrFail($id) : Invoice::findOrFail($id);
        
        // Ambil template email dari DB (asumsi tabel email_templates)
        $template = \DB::table('email_templates')->where('type', $type)->first();
        
        $subject = str_replace('{number}', $doc->quotation_number ?? $doc->invoice_number, $template->subject);
        $body = $template->content; // Isi template dari DB

        Mail::send([], [], function ($message) use ($doc, $subject, $body) {
            $message->to($doc->company->email)
                ->subject($subject)
                ->html($body) // Gunakan isi dari DB
                ->attach(storage_path("app/public/" . $doc->pdf_path)); // Ambil path dari DB
        });

        return back()->with('success', 'Email Sent!');
    }
}
