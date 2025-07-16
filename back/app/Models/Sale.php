<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_number',
        'client_id',
        'user_id',
        'status',
        'payment_status',
        'sale_date',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'notes'
    ];

    protected $casts = [
        'sale_date' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2'
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function accountsReceivable(): HasMany
    {
        return $this->hasMany(AccountsReceivable::class);
    }

    // Métodos de negócio
    public function calculateTotal(): void
    {
        $this->subtotal = $this->saleItems->sum('total_price');
        $this->total_amount = $this->subtotal - $this->discount_amount + $this->tax_amount;
        $this->save();
    }

    public function getTotalPaid(): float
    {
        return $this->payments()
            ->where('status', 'confirmed')
            ->sum('amount');
    }

    public function getRemainingAmount(): float
    {
        return $this->total_amount - $this->getTotalPaid();
    }

    public function isPaid(): bool
    {
        return $this->getRemainingAmount() <= 0;
    }

    public function generateSaleNumber(): string
    {
        $year = date('Y');
        $lastSale = self::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastSale ? intval(substr($lastSale->sale_number, -3)) + 1 : 1;
        
        return sprintf('PDV-%s-%03d', $year, $sequence);
    }

    public function updatePaymentStatus(): void
    {
        $totalPaid = $this->getTotalPaid();
        $remaining = $this->getRemainingAmount();
        
        if ($remaining <= 0) {
            $this->payment_status = 'paid';
        } elseif ($totalPaid > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'pending';
        }
        
        $this->save();
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($sale) {
            if (empty($sale->sale_number)) {
                $sale->sale_number = $sale->generateSaleNumber();
            }
        });
    }
}
