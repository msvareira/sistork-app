<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

class SimpleTest extends Command
{
    protected $signature = 'test:simple';
    protected $description = 'Simple test for SaleItem creation';

    public function handle()
    {
        $this->info('Starting simple test...');

        // Test direct DB insert first
        $this->info('Testing direct DB insert...');
        
        try {
            $result = DB::table('sale_items')->insert([
                'sale_id' => 22, // Use the existing sale ID 22
                'part_id' => null,
                'item_type' => 'other',
                'item_name' => 'Direct Insert Test',
                'item_code' => null,
                'quantity' => 1,
                'unit_price' => 100.0,
                'discount_amount' => 0,
                'total_price' => 100.0,
                'notes' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            $this->info('Direct DB insert result: ' . ($result ? 'SUCCESS' : 'FAILED'));
            
        } catch (\Exception $e) {
            $this->error('Direct DB insert failed: ' . $e->getMessage());
        }

        // Test with Eloquent
        $this->info('Testing with Eloquent...');
        
        try {
            $saleItem = new SaleItem();
            $this->info('SaleItem object created');
            
            $saleItem->sale_id = 22;
            $this->info('sale_id set');
            
            $saleItem->item_type = 'other';
            $this->info('item_type set');
            
            $saleItem->item_name = 'Eloquent Test';
            $this->info('item_name set');
            
            $saleItem->quantity = 1;
            $this->info('quantity set');
            
            $saleItem->unit_price = 100.0;
            $this->info('unit_price set');
            
            $saleItem->discount_amount = 0;
            $this->info('discount_amount set');
            
            $saleItem->total_price = 100.0;
            $this->info('total_price set');
            
            $this->info('About to call save()...');
            $saleItem->save();
            $this->info('save() completed successfully! ID: ' . $saleItem->id);
            
        } catch (\Exception $e) {
            $this->error('Eloquent test failed: ' . $e->getMessage());
            $this->error('File: ' . $e->getFile());
            $this->error('Line: ' . $e->getLine());
        }

        return 0;
    }
}
