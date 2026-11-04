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

class InvoiceReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invoice $invoice, public int $reminderNumber) {}

    public function envelope(): Envelope
    {
        $replyTo = config('portfolio.links.email');
        $prefix = match (true) {
            $this->reminderNumber >= config('portfolio.reminders.max') => 'Final reminder',
            $this->reminderNumber > 1 => 'Following up',
            default => 'Friendly reminder',
        };

        return new Envelope(
            replyTo: $replyTo ? [new Address($replyTo, config('portfolio.name'))] : [],
            subject: "{$prefix}: invoice {$this->invoice->number} (".Money::format($this->invoice->totalCents()).')',
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.invoice-reminder', with: [
            'total' => Money::format($this->invoice->totalCents()),
            'studio' => config('portfolio.name'),
            'final' => $this->reminderNumber >= config('portfolio.reminders.max'),
        ]);
    }
}
