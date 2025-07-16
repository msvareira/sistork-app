<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'part_id',
        'item_type',
        'item_name',
        'item_code',
        'quantity',
        'unit_price',
        'discount_amount',
        'total_price',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_price' => 'decimal:2'
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }

    // Métodos de negócio
    public function calculateTotal(): void
    {
        $this->total_price = ($this->quantity * $this->unit_price) - $this->discount_amount;
        $this->save();
    }

    public function getSubtotal(): float
    {
        return $this->quantity * $this->unit_price;
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($saleItem) {
            $saleItem->calculateTotal();
        });
        
        static::updating(function ($saleItem) {
            $saleItem->calculateTotal();
        });
        
        static::saved(function ($saleItem) {
            $saleItem->sale->calculateTotal();
        });
        
        static::deleted(function ($saleItem) {
            $saleItem->sale->calculateTotal();
        });
    }
}
