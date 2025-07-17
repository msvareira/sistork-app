<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountsPayable extends Model
{
    use HasFactory;

    protected $table = 'accounts_payable';

    protected $fillable = [
        'supplier_name',
        'supplier_document',
        'document_number',
        'original_amount',
        'remaining_amount',
        'due_date',
        'payment_date',
        'issue_date',
        'status',
        'type',
        'category',
        'description',
        'notes',
        'interest_amount',
        'discount_amount'
    ];

    protected $casts = [
        'original_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'due_date' => 'date',
        'payment_date' => 'date',
        'issue_date' => 'date'
    ];

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

    public function getTotalWithCharges(): float
    {
        return $this->remaining_amount + $this->interest_amount - $this->discount_amount;
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid' || $this->remaining_amount <= 0;
    }

    public function isPartial(): bool
    {
        return $this->status === 'partial' || ($this->remaining_amount < $this->original_amount && $this->remaining_amount > 0);
    }

    public function getEffectiveAmount(): float
    {
        return $this->original_amount + $this->interest_amount - $this->discount_amount;
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($payable) {
            if (empty($payable->remaining_amount)) {
                $payable->remaining_amount = $payable->original_amount;
            }
        });
    }
}
