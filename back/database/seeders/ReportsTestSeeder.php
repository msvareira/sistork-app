<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Part;
use App\Models\Client;
use App\Models\AccountsPayable;
use App\Models\AccountsReceivable;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ReportsTestSeeder extends Seeder
{
    public function run()
    {
        // Criar clientes de teste
        $client1 = Client::firstOrCreate([
            'name' => 'Cliente Teste 1',
            'email' => 'cliente1@teste.com',
            'phone' => '(11) 99999-9999'
        ]);

        $client2 = Client::firstOrCreate([
            'name' => 'Cliente Teste 2', 
            'email' => 'cliente2@teste.com',
            'phone' => '(11) 88888-8888'
        ]);

        // Criar peças de teste
        $part1 = Part::firstOrCreate([
            'name' => 'Peça Teste 1',
            'internal_code' => 'PT001',
            'quantity' => 100,
            'cost_price' => 50.00,
            'sell_price' => 100.00,
            'unit_price' => 100.00,
            'supplier' => 'Fornecedor Teste'
        ]);

        $part2 = Part::firstOrCreate([
            'name' => 'Peça Teste 2',
            'internal_code' => 'PT002', 
            'quantity' => 50,
            'cost_price' => 75.00,
            'sell_price' => 150.00,
            'unit_price' => 150.00,
            'supplier' => 'Fornecedor Teste 2'
        ]);

        // Criar vendas de teste
        $sale1 = Sale::firstOrCreate([
            'sale_number' => 'VND-001',
            'client_id' => $client1->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'sale_date' => Carbon::now()->subDays(5),
            'subtotal' => 250.00,
            'total_amount' => 250.00,
            'created_at' => Carbon::now()->subDays(5)
        ]);

        $sale2 = Sale::firstOrCreate([
            'sale_number' => 'VND-002',
            'client_id' => $client2->id,
            'status' => 'completed', 
            'payment_status' => 'paid',
            'sale_date' => Carbon::now()->subDays(10),
            'subtotal' => 300.00,
            'total_amount' => 300.00,
            'created_at' => Carbon::now()->subDays(10)
        ]);

        // Criar itens de venda
        SaleItem::firstOrCreate([
            'sale_id' => $sale1->id,
            'part_id' => $part1->id,
            'item_name' => $part1->name,
            'quantity' => 2,
            'unit_price' => 100.00,
            'total_price' => 200.00,
            'created_at' => Carbon::now()->subDays(5)
        ]);

        SaleItem::firstOrCreate([
            'sale_id' => $sale1->id,
            'part_id' => $part2->id,
            'item_name' => $part2->name,
            'quantity' => 1,
            'unit_price' => 50.00,
            'total_price' => 50.00,
            'created_at' => Carbon::now()->subDays(5)
        ]);

        SaleItem::firstOrCreate([
            'sale_id' => $sale2->id,
            'part_id' => $part2->id,
            'item_name' => $part2->name,
            'quantity' => 2,
            'unit_price' => 150.00,
            'total_price' => 300.00,
            'created_at' => Carbon::now()->subDays(10)
        ]);

        // Criar contas a receber
        AccountsReceivable::firstOrCreate([
            'sale_id' => $sale1->id,
            'client_id' => $client1->id,
            'document_number' => 'REC-001',
            'original_amount' => 250.00,
            'remaining_amount' => 250.00,
            'due_date' => Carbon::now()->addDays(30),
            'issue_date' => Carbon::now()->subDays(5),
            'status' => 'paid',
            'payment_date' => Carbon::now()->subDays(3),
            'type' => 'sale'
        ]);

        // Criar contas a pagar
        AccountsPayable::firstOrCreate([
            'supplier_name' => 'Fornecedor Teste',
            'document_number' => 'PAG-001',
            'original_amount' => 150.00,
            'remaining_amount' => 150.00,
            'due_date' => Carbon::now()->addDays(15),
            'issue_date' => Carbon::now()->subDays(7),
            'status' => 'paid',
            'payment_date' => Carbon::now()->subDays(2),
            'category' => 'fornecedores',
            'type' => 'purchase'
        ]);

        AccountsPayable::firstOrCreate([
            'supplier_name' => 'Energia Elétrica',
            'document_number' => 'ENERGIA-001', 
            'original_amount' => 300.00,
            'remaining_amount' => 300.00,
            'due_date' => Carbon::now()->addDays(10),
            'issue_date' => Carbon::now()->subDays(20),
            'status' => 'pending',
            'category' => 'utilidades',
            'type' => 'utility'
        ]);
    }
}
