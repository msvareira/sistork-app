<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::firstOrCreate([
            'email' => 'admin@sistork.com'
        ], [
            'name' => 'Administrador',
            'password' => Hash::make('admin123'),
        ]);

        // Create mechanic user
        User::firstOrCreate([
            'email' => 'mecanico@sistork.com'
        ], [
            'name' => 'João Mecânico',
            'password' => Hash::make('mecanico123'),
        ]);

        // Create attendant user
        User::firstOrCreate([
            'email' => 'atendente@sistork.com'
        ], [
            'name' => 'Maria Atendente',
            'password' => Hash::make('atendente123'),
        ]);
    }
}
