<?php

namespace Database\Seeders;

use App\Models\Part;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PartSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parts = [
            [
                'name' => 'Óleo Motor 20W50',
                'internal_code' => 'OIL001',
                'quantity' => 25,
                'cost_price' => 15.00,
                'sell_price' => 25.00,
                'supplier' => 'Ipiranga',
            ],
            [
                'name' => 'Filtro de Óleo',
                'internal_code' => 'FIL001',
                'quantity' => 15,
                'cost_price' => 8.00,
                'sell_price' => 15.00,
                'supplier' => 'Tecfil',
            ],
            [
                'name' => 'Pastilha de Freio Dianteira',
                'internal_code' => 'BRK001',
                'quantity' => 10,
                'cost_price' => 35.00,
                'sell_price' => 65.00,
                'supplier' => 'Cobreq',
            ],
            [
                'name' => 'Corrente de Transmissão',
                'internal_code' => 'CHN001',
                'quantity' => 8,
                'cost_price' => 45.00,
                'sell_price' => 85.00,
                'supplier' => 'DID',
            ],
            [
                'name' => 'Vela de Ignição',
                'internal_code' => 'SPK001',
                'quantity' => 30,
                'cost_price' => 12.00,
                'sell_price' => 22.00,
                'supplier' => 'NGK',
            ],
            [
                'name' => 'Pneu Traseiro 140/70-17',
                'internal_code' => 'TYR001',
                'quantity' => 4,
                'cost_price' => 120.00,
                'sell_price' => 200.00,
                'supplier' => 'Pirelli',
            ],
        ];

        foreach ($parts as $part) {
            Part::create($part);
        }
    }
}
