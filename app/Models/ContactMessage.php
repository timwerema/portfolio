<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'name', 'email', 'service', 'message', 'ip_address',
        'source', 'services', 'package', 'budget', 'timeline', 'business', 'business_website', 'phone',
    ];

    public const BUDGETS = ['Under $1,000', '$1,000 - $2,500', '$2,500 - $5,000', '$5,000 - $10,000', '$10,000+', 'Not sure yet'];

    public const TIMELINES = ['As soon as possible', 'Within a month', '1 - 3 months', 'Flexible'];

    protected $hidden = ['ip_address'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'services' => 'array',
        ];
    }
}
