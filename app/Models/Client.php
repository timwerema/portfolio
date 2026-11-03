<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = ['name', 'company', 'email', 'phone', 'notes'];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class)->latest();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->latest('issue_date');
    }

    /** Unpaid total (cents) across invoices that have been sent. */
    public function balanceCents(): int
    {
        return $this->invoices->where('status', Invoice::SENT)->sum(fn (Invoice $i) => $i->totalCents());
    }
}
