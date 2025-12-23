<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Proposal;

class ProposalSentNotification extends Notification
{
    use Queueable;

    protected $proposal;

    public function __construct(Proposal $proposal)
    {
        $this->proposal = $proposal;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Proposal Sent')
            ->line('A proposal has been sent.')
            ->action('View Proposal', url('/proposal/'.$this->proposal->id))
            ->line('Thank you.');
    }
}
