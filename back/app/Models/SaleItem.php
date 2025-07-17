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
        // Do not save here - let the calling code handle the save
        // This method just calculates and sets the value
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
            // Recalculate Sale total after SaleItem is saved
            if ($saleItem->sale_id && $saleItem->sale) {
                $saleItem->sale->calculateTotal();
            }
        });
        
        static::deleted(function ($saleItem) {
            // Recalculate Sale total after SaleItem is deleted
            if ($saleItem->sale_id && $saleItem->sale) {
                $saleItem->sale->calculateTotal();
            }
        });
    }
}
