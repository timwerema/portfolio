<?php

namespace App\Mail;

use App\Models\Preview;
use App\Models\PreviewFeedback;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Sent to you when a client approves or requests changes. */
class PreviewDecisionReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Preview $preview, public PreviewFeedback $feedback) {}

    public function envelope(): Envelope
    {
        $verb = $this->feedback->decision === Preview::APPROVED ? 'approved' : 'requested changes on';

        return new Envelope(subject: "{$this->preview->client_name} {$verb} \"{$this->preview->title}\" (v{$this->feedback->version})");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.preview-decision');
    }
}
