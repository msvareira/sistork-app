<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TestSaleItem extends Command
{
    protected $signature = 'test:sale-item';
    protected $description = 'Test SaleItem creation';

    public function handle()
    {
        $this->info('Testing SaleItem creation...');

        // Create a test sale first
        $user = User::find(2);
        $this->info('User found: ' . $user->name);

        DB::beginTransaction();

        try {
            // Create sale
            $sale = new Sale();
            $sale->user_id = $user->id;
            $sale->client_id = null; // Changed from client_name to client_id
            $sale->sale_number = "TEST-001";
            $sale->status = "completed";
            $sale->payment_status = "paid";
            $sale->total_amount = 100.0;
            $sale->save();
            
            $this->info('Sale created with ID: ' . $sale->id);
            
            // Try to create SaleItem
            $this->info('Creating SaleItem...');
            
            $itemData = [
                'sale_id' => $sale->id,
                'part_id' => null,
                'item_type' => 'other',
                'item_name' => 'Test Item',
                'item_code' => null,
                'quantity' => 1,
                'unit_price' => 100.0,
                'discount_amount' => 0,
                'total_price' => 100.0,
                'notes' => null
            ];
            
            $this->info('Item data: ' . json_encode($itemData));
            
            // Try different approaches to create SaleItem
            $this->info('Attempting method 1: SaleItem::create()');
            try {
                $saleItem = SaleItem::create($itemData);
                $this->info('SUCCESS with create(): ' . $saleItem->id);
            } catch (\Exception $e) {
                $this->error('FAILED with create(): ' . $e->getMessage());
                
                $this->info('Attempting method 2: new SaleItem + save()');
                try {
                    $saleItem = new SaleItem();
                    $saleItem->sale_id = $sale->id;
                    $saleItem->part_id = null;
                    $saleItem->item_type = 'other';
                    $saleItem->item_name = 'Test Item';
                    $saleItem->item_code = null;
                    $saleItem->quantity = 1;
                    $saleItem->unit_price = 100.0;
                    $saleItem->discount_amount = 0;
                    $saleItem->total_price = 100.0;
                    $saleItem->notes = null;
                    $saleItem->save();
                    
                    $this->info('SUCCESS with new + save(): ' . $saleItem->id);
                } catch (\Exception $e2) {
                    $this->error('FAILED with new + save(): ' . $e2->getMessage());
                    throw $e2;
                }
            }
            
            $this->info('SaleItem created with ID: ' . $saleItem->id);
            
            DB::commit();
            
            $this->info('Transaction committed successfully!');
            
        } catch (\Exception $e) {
            DB::rollback();
            $this->error('ERROR: ' . $e->getMessage());
            $this->error('File: ' . $e->getFile());
            $this->error('Line: ' . $e->getLine());
            $this->error('Trace:');
            $this->error($e->getTraceAsString());
        }

        return 0;
    }
}
