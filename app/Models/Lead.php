<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A business Timasi has contacted or plans to contact, and where it stands. */
class Lead extends Model
{
    public const STATUSES = ['To contact', 'Contacted', 'Replied', 'Call booked', 'Concept sent', 'Won', 'Not interested'];

    /** Statuses that still need attention (shown first, counted as "open"). */
    public const OPEN = ['To contact', 'Contacted', 'Replied', 'Call booked', 'Concept sent'];

    public const CHANNELS = ['Facebook', 'Instagram', 'Phone or text', 'Email', 'In person', 'LinkedIn', 'Other'];

    public const INTERESTS = ['Website', 'AI helper', 'Software', 'Other'];

    protected $fillable = ['business', 'contact_name', 'channel', 'contact_info', 'interest', 'status', 'last_contacted_on', 'follow_up_on', 'demo_url', 'notes'];

    protected function casts(): array
    {
        return [
            'last_contacted_on' => 'date:Y-m-d',
            'follow_up_on' => 'date:Y-m-d',
        ];
    }
}
