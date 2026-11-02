<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactMessageReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ContactMessage $contactMessage) {}

    public function envelope(): Envelope
    {
        $subject = 'New enquiry from '.$this->contactMessage->name;

        if ($this->contactMessage->service) {
            $subject .= ' ('.$this->contactMessage->service.')';
        }

        return new Envelope(
            replyTo: [new Address($this->contactMessage->email, $this->contactMessage->name)],
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.contact-message-received');
    }
}
