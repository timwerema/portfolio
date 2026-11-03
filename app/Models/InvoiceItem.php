<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $fillable = ['description', 'quantity', 'unit_price_cents', 'position'];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'unit_price_cents' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function amountCents(): int
    {
        return (int) round($this->quantity * $this->unit_price_cents);
    }
}
