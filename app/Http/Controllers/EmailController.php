<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EmailController extends Controller
{
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
