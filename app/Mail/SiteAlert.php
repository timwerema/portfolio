<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SiteAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $alertSubject, public array $lines) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '['.parse_url(config('app.url'), PHP_URL_HOST).'] '.$this->alertSubject);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.site-alert');
    }
}
