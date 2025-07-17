<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CheckTables extends Command
{
    protected $signature = 'test:check-tables';
    protected $description = 'Check database tables and structure';

    public function handle()
    {
        $this->info('Checking database tables...');

        // Check if sale_items table exists
        if (Schema::hasTable('sale_items')) {
            $this->info('✓ sale_items table exists');
            
            // Get table columns
            $columns = Schema::getColumnListing('sale_items');
            $this->info('Columns: ' . implode(', ', $columns));
            
            // Check foreign key constraints
            $this->info('Checking constraints...');
            
            try {
                $result = DB::select("
                    SELECT 
                        CONSTRAINT_NAME,
                        COLUMN_NAME,
                        REFERENCED_TABLE_NAME,
                        REFERENCED_COLUMN_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_NAME = 'sale_items' 
                    AND CONSTRAINT_NAME != 'PRIMARY'
                    AND TABLE_SCHEMA = DATABASE()
                ");
                
                foreach ($result as $constraint) {
                    $this->info("FK: {$constraint->COLUMN_NAME} -> {$constraint->REFERENCED_TABLE_NAME}.{$constraint->REFERENCED_COLUMN_NAME}");
                }
                
            } catch (\Exception $e) {
                $this->error('Error checking constraints: ' . $e->getMessage());
            }
            
        } else {
            $this->error('✗ sale_items table does not exist');
        }

        // Check if sales table exists
        if (Schema::hasTable('sales')) {
            $this->info('✓ sales table exists');
            
            // Count existing sales
            $salesCount = DB::table('sales')->count();
            $this->info("Sales count: {$salesCount}");
            
        } else {
            $this->error('✗ sales table does not exist');
        }

        return 0;
    }
}
