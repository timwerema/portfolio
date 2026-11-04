<?php

namespace App\Mail;

use App\Support\Money;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklySummary extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function envelope(): Envelope
    {
        $paid = Money::format($this->data['paid_last_week_cents']);
        $overdue = count($this->data['overdue']);

        return new Envelope(subject: "Your week: {$paid} paid".($overdue ? " · {$overdue} overdue" : '').' · '.now()->format('M j'));
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.weekly-summary', with: ['money' => fn (int $c) => Money::format($c)]);
    }
}
