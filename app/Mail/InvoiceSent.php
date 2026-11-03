<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Support\Money;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceSent extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invoice $invoice) {}

    public function envelope(): Envelope
    {
        $replyTo = config('portfolio.links.email');

        return new Envelope(
            replyTo: $replyTo ? [new Address($replyTo, config('portfolio.name'))] : [],
            subject: "Invoice {$this->invoice->number} from ".config('portfolio.name').' - '.Money::format($this->invoice->totalCents()),
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.invoice-sent', with: [
            'total' => Money::format($this->invoice->totalCents()),
            'studio' => config('portfolio.name'),
        ]);
    }
}
