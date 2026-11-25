<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadNudge extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  list<array<string, mixed>>  $due
     * @param  list<array<string, mixed>>  $toContact
     */
    public function __construct(public array $due, public array $toContact) {}

    public function envelope(): Envelope
    {
        $parts = array_filter([
            count($this->due) ? count($this->due).' follow-up'.(count($this->due) === 1 ? '' : 's').' due' : null,
            count($this->toContact) ? count($this->toContact).' to contact' : null,
        ]);

        return new Envelope(subject: 'Leads today: '.implode(' · ', $parts));
    }

    public function content(): Content
    {
        // Each lead becomes one plain line. Text only: Blade escapes it, so a business name cannot inject markup.
        $dueLines = array_map(fn (array $l) => implode(' · ', array_filter([
            $l['business'].($l['contact_name'] ? ' ('.$l['contact_name'].')' : ''),
            $l['channel'] ?: 'no channel set',
            $l['status'],
            $l['days_late'] > 0 ? $l['days_late'].' day'.($l['days_late'] === 1 ? '' : 's').' late' : 'due today',
            $l['last_contacted_on'] ? 'last contact '.$l['last_contacted_on'] : null,
        ])), $this->due);
        $toContactLines = array_map(fn (array $l) => implode(' · ', [$l['business'], $l['channel'] ?: 'no channel set', 'added '.$l['added']]), $this->toContact);

        return new Content(markdown: 'mail.lead-nudge', with: ['url' => route('admin.leads.index'), 'dueLines' => $dueLines, 'toContactLines' => $toContactLines]);
    }
}
