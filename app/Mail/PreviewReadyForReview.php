<?php

namespace App\Mail;

use App\Models\Preview;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Sent to the client: "your demo is ready to review". */
class PreviewReadyForReview extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Preview $preview) {}

    public function envelope(): Envelope
    {
        $replyTo = config('portfolio.links.email');

        return new Envelope(
            replyTo: $replyTo ? [new Address($replyTo, config('portfolio.name'))] : [],
            subject: 'Your demo is ready to review: '.$this->preview->title,
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.preview-ready', with: ['studio' => config('portfolio.name')]);
    }
}
