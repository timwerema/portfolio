<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One lean the Rundown model published before a game started (see App\Support\Rundown\Board). */
class RundownPrediction extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'graded_at' => 'datetime',
            'line' => 'float',
            'adjustment' => 'float',
        ];
    }
}
