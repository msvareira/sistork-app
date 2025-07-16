<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clients = [
            [
                'name' => 'João Silva',
                'phone' => '(11) 99999-9999',
                'motorcycle_model' => 'Honda CG 160',
                'license_plate' => 'ABC-1234',
                'notes' => 'Cliente preferencial, sempre pontual nos pagamentos',
            ],
            [
                'name' => 'Maria Santos',
                'phone' => '(11) 88888-8888',
                'motorcycle_model' => 'Yamaha YBR 125',
                'license_plate' => 'XYZ-5678',
                'notes' => null,
            ],
            [
                'name' => 'Pedro Oliveira',
                'phone' => '(11) 77777-7777',
                'motorcycle_model' => 'Honda CB 600F',
                'license_plate' => 'DEF-9012',
                'notes' => 'Moto com modificações especiais',
            ],
            [
                'name' => 'Ana Costa',
                'phone' => '(11) 66666-6666',
                'motorcycle_model' => 'Suzuki GSX-R 1000',
                'license_plate' => 'GHI-3456',
                'notes' => 'Cliente de alta performance',
            ],
        ];

        foreach ($clients as $client) {
            Client::create($client);
        }
    }
}
