<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Invoice extends Model
{
    public const DRAFT = 'draft';

    public const SENT = 'sent';

    public const PAID = 'paid';

    public const VOID = 'void';

    protected $fillable = ['client_id', 'project_id', 'issue_date', 'due_date', 'notes', 'payment_link'];

    protected $appends = ['total_cents', 'is_overdue', 'public_url'];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'sent_at' => 'datetime',
            'paid_at' => 'datetime',
            'last_reminder_at' => 'datetime',
            'reminders_paused' => 'boolean',
            'reminders_sent' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice) {
            $invoice->token ??= Str::random(40);
            $invoice->number ??= self::nextNumber();
        });
    }

    public static function nextNumber(): string
    {
        $last = self::query()->where('number', 'like', 'INV-%')->orderByDesc('id')->value('number');
        $n = $last ? ((int) substr($last, 4)) + 1 : 1;

        return 'INV-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('position');
    }

    public function totalCents(): int
    {
        return (int) round($this->items->sum(fn (InvoiceItem $i) => $i->amountCents()));
    }

    public function getTotalCentsAttribute(): int
    {
        return $this->totalCents();
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === self::SENT && $this->due_date?->isBefore(today());
    }

    public function daysOverdue(): int
    {
        return $this->due_date && $this->due_date->isBefore(today()) ? (int) $this->due_date->diffInDays(today()) : 0;
    }

    /** Is a payment reminder due today? (sent, unpaid, overdue enough, not paused, under the cap, spaced out) */
    public function reminderDue(): bool
    {
        $cfg = config('portfolio.reminders');

        return $this->status === self::SENT
            && ! $this->reminders_paused
            && $this->client?->email
            && $this->reminders_sent < $cfg['max']
            && $this->daysOverdue() >= $cfg['days_after_due']
            && (! $this->last_reminder_at || $this->last_reminder_at->lte(now()->subDays($cfg['repeat_every_days'])->addHour()));
    }

    public function getPublicUrlAttribute(): string
    {
        return route('invoices.public', $this->token);
    }
}
