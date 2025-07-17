<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class AccountsReceivable extends Model
{
    use HasFactory;

    protected $table = 'accounts_receivable';

    protected $fillable = [
        'sale_id',
        'quote_id',
        'client_id',
        'document_number',
        'original_amount',
        'remaining_amount',
        'due_date',
        'payment_date',
        'issue_date',
        'status',
        'type',
        'description',
        'notes',
        'interest_rate',
        'fine_rate'
    ];

    protected $casts = [
        'original_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'fine_rate' => 'decimal:2',
        'due_date' => 'date',
        'payment_date' => 'date',
        'issue_date' => 'date'
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    // Métodos de negócio
    public function isOverdue(): bool
    {
        return $this->due_date < now() && $this->status !== 'paid';
    }

    public function getDaysOverdue(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        
        return now()->diffInDays($this->due_date);
    }

    public function calculateInterest(): float
    {
        if (!$this->isOverdue() || $this->interest_rate <= 0) {
            return 0;
        }
        
        $months = now()->diffInMonths($this->due_date);
        return $this->remaining_amount * ($this->interest_rate / 100) * $months;
    }

    public function calculateFine(): float
    {
        if (!$this->isOverdue() || $this->fine_rate <= 0) {
            return 0;
        }
        
        return $this->remaining_amount * ($this->fine_rate / 100);
    }

    public function getTotalWithCharges(): float
    {
        return $this->remaining_amount + $this->calculateInterest() + $this->calculateFine();
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid' || $this->remaining_amount <= 0;
    }

    public function isPartial(): bool
    {
        return $this->status === 'partial' || ($this->remaining_amount < $this->original_amount && $this->remaining_amount > 0);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($receivable) {
            if (empty($receivable->remaining_amount)) {
                $receivable->remaining_amount = $receivable->original_amount;
            }
        });
    }
}
