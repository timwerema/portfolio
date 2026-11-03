<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Preview extends Model
{
    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const CHANGES_REQUESTED = 'changes_requested';

    protected $fillable = ['client_name', 'client_email', 'title', 'note', 'demo_url'];

    protected $hidden = ['html_path'];

    protected $appends = ['review_url', 'has_upload'];

    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Preview $preview) {
            $preview->token ??= Str::random(40);
        });

        static::deleted(function (Preview $preview) {
            if ($preview->html_path) {
                Storage::disk('local')->delete($preview->html_path);
            }
        });
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(PreviewFeedback::class)->latest();
    }

    public function getReviewUrlAttribute(): string
    {
        return route('previews.review', $this->token);
    }

    public function getHasUploadAttribute(): bool
    {
        return (bool) $this->html_path;
    }

    /** Where the client's browser loads the demo from (inside the review page's frame). */
    public function frameUrl(): ?string
    {
        return $this->html_path ? route('previews.demo', $this->token) : $this->demo_url;
    }

    /** Store a new uploaded index.html, replacing any previous upload. */
    public function storeHtml(string $contents): void
    {
        if ($this->html_path) {
            Storage::disk('local')->delete($this->html_path);
        }

        $this->html_path = 'previews/'.$this->token.'-v'.$this->version.'.html';
        Storage::disk('local')->put($this->html_path, $contents);
    }
}
