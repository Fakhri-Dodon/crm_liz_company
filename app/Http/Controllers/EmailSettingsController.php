<?php

namespace App\Http\Controllers;

use App\Models\MailSettings;
use App\Models\EmailTemplates;
use App\Models\EmailLogs;
use App\Mail\SystemMail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class EmailSettingsController extends Controller
{
    private function setMailConfig($settings)
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => $settings['smtp_host'],
            'mail.mailers.smtp.port' => $settings['smtp_port'],
            'mail.mailers.smtp.username' => $settings['smtp_user'],
            'mail.mailers.smtp.password' => $settings['smtp_password'],
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.from.address' => $settings['system_email'],
            'mail.from.name' => $settings['default_from_name'],
        ]);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'system_email' => 'required|email',
            'smtp_host' => 'required',
            'smtp_port' => 'required',
            'smtp_user' => 'required',
            'smtp_password' => 'required',
            'default_from_name' => 'required',
        ]);

        MailSettings::updateOrCreate(
            ['id' => $request->id], 
            $validated
        );

        return back()->with('success', 'Settings saved successfully!');
    }

    public function testConnection(Request $request)
    {
        try {
            $this->setMailConfig($request->all());

            $subject = "Uji Coba Koneksi SMTP Berhasil";
            $body = "Halo,\n\nIni adalah email percobaan menggunakan template profesional. Jika Anda menerima email ini, berarti pengaturan SMTP Anda sudah bekerja dengan sempurna.\n\nSelamat menggunakan sistem!";

            Mail::to($request->system_email)->send(new SystemMail($subject, $body));

            \App\Models\EmailLogs::create([
                'to' => $request->system_email,
                'subject' => $subject,
                'body' => $body,
                'status' => 'success',
                'sent_date' => now(),
            ]);

            return back()->with('success', 'Professional email successfully sent to ' . $request->system_email);
        } catch (\Exception $e) {
            \App\Models\EmailLogs::create([
                'to' => $request->system_email,
                'subject' => 'FAILED: Uji Coba SMTP',
                'body' => $e->getMessage(),
                'status' => 'failed',
                'sent_date' => now(),
            ]);
            
            return back()->withErrors(['message' => 'SMTP error: ' . $e->getMessage()]);
        }
    }

    public function destroyLog($id)
    {
        try {
            $log = \App\Models\EmailLogs::findOrFail($id);
            $log->update(['deleted' => 1]);

            return back()->with('success', 'Log successfully deleted.');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Failed to delete: ' . $e->getMessage()]);
        }
    }
}