<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SystemMail extends Mailable
{
    use Queueable, SerializesModels;

    // Tambahkan properti publik agar bisa diakses di view email
    public $subjectText;
    public $messageBody;

    /**
     * Terima data dari Controller lewat Constructor
     */
    public function __construct($subject, $body)
    {
        $this->subjectText = $subject;
        $this->messageBody = $body;
    }

    /**
     * Masukkan subjek dinamis ke Envelope
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText,
        );
    }

    /**
     * Hubungkan ke file view blade
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.template', 
        );
    }

    public function attachments(): array
    {
        return [];
    }
}