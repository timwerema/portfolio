<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreviewFeedback extends Model
{
    protected $table = 'preview_feedback';

    protected $fillable = ['version', 'decision', 'name', 'comment', 'ip_address'];

    protected $hidden = ['ip_address'];

    public function preview(): BelongsTo
    {
        return $this->belongsTo(Preview::class);
    }
}
