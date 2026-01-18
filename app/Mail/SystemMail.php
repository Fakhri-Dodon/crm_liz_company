<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use App\Models\AppConfig;

class SystemMail extends Mailable
{
    use Queueable, SerializesModels;

    public $subjectText;
    public $messageBody;
    public $filePath;
    public $companyInfo;

    /**
     * Tambahkan parameter $filePath dengan default null
     */
    public function __construct($subject, $body, $filePath = null)
    {
        $this->subjectText = $subject;
        $this->messageBody = $body;
        $this->filePath = $filePath; 

        $appConfig = AppConfig::where('deleted', 0)->first();

        $this->companyInfo = [
            'name' => $appConfig->company_name ?? config('app.name'),
            'logo' => $appConfig->logo_path ?? null, // Asumsi ini path gambar
            'address' => $appConfig->address ?? 'Alamat Default Perusahaan',
        ];
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.template', 
        );
    }

    /**
     * Logic Lampiran Otomatis
     */
    public function attachments(): array
    {
        $attachments = [];

        $fullPath = public_path('storage/' . $this->filePath);

        if ($this->filePath && file_exists($fullPath)) {
            $attachments[] = Attachment::fromPath($fullPath);
        }

        return $attachments;
    }
}