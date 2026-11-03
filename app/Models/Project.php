<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    public const STATUSES = ['lead', 'proposal', 'in_progress', 'review', 'completed', 'on_hold'];

    public const PACKAGES = ['Starter', 'Business', 'Custom', 'Care plan', 'Other'];

    protected $fillable = ['client_id', 'name', 'package', 'status', 'budget_cents', 'start_date', 'due_date', 'notes'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'budget_cents' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
