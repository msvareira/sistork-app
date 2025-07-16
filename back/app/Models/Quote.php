<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    protected $fillable = [
        'client_id',
        'total',
        'notes',
        'expires_at',
        'status',
        'scheduled_date',
        'scheduled_time',
        'schedule_notes'
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'expires_at' => 'datetime',
        'scheduled_date' => 'date',
        'scheduled_time' => 'datetime:H:i',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function quoteParts(): HasMany
    {
        return $this->hasMany(QuotePart::class);
    }

    public function quoteServices(): HasMany
    {
        return $this->hasMany(QuoteService::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
