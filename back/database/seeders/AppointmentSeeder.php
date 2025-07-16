<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Quote;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clients = Client::all();
        $quotes = Quote::all();

        if ($clients->isEmpty()) {
            return;
        }

        $appointments = [
            [
                'client_id' => $clients->first()->id,
                'quote_id' => $quotes->isNotEmpty() ? $quotes->first()->id : null,
                'service' => 'Troca de óleo e filtro',
                'date' => now()->addDays(1)->format('Y-m-d'),
                'time' => '09:00:00',
                'status' => 'scheduled',
                'notes' => 'Cliente prefere horário da manhã',
            ],
            [
                'client_id' => $clients->count() > 1 ? $clients->skip(1)->first()->id : $clients->first()->id,
                'quote_id' => null,
                'service' => 'Revisão geral',
                'date' => now()->addDays(2)->format('Y-m-d'),
                'time' => '14:30:00',
                'status' => 'confirmed',
                'notes' => 'Revisão dos 10.000 km',
            ],
            [
                'client_id' => $clients->count() > 2 ? $clients->skip(2)->first()->id : $clients->first()->id,
                'quote_id' => $quotes->count() > 1 ? $quotes->skip(1)->first()->id : null,
                'service' => 'Reparo do freio traseiro',
                'date' => now()->addDays(3)->format('Y-m-d'),
                'time' => '10:00:00',
                'status' => 'scheduled',
                'notes' => 'Verificar pastilhas e disco',
            ],
            [
                'client_id' => $clients->count() > 3 ? $clients->skip(3)->first()->id : $clients->first()->id,
                'quote_id' => null,
                'service' => 'Instalação de acessórios',
                'date' => now()->addDays(5)->format('Y-m-d'),
                'time' => '16:00:00',
                'status' => 'scheduled',
                'notes' => 'Instalação de bagageiro e protetor de motor',
            ],
            [
                'client_id' => $clients->first()->id,
                'quote_id' => null,
                'service' => 'Limpeza de carburador',
                'date' => now()->addDays(7)->format('Y-m-d'),
                'time' => '08:30:00',
                'status' => 'scheduled',
                'notes' => 'Moto com problemas de partida',
            ],
        ];

        foreach ($appointments as $appointmentData) {
            Appointment::create($appointmentData);
        }
    }
}
