<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    public const CATEGORIES = ['Hosting', 'Domains', 'Software', 'Equipment', 'Marketing', 'Contractors', 'Other'];

    protected $fillable = ['date', 'vendor', 'category', 'amount_cents', 'project_id', 'notes'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'amount_cents' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
