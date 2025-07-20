<?php
require_once 'vendor/autoload.php';

use App\Models\AccountsPayable;
use Carbon\Carbon;

// Simular o ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Http\Kernel')->bootstrap();

// Criar uma conta a pagar de teste com status pending
try {
    $account = AccountsPayable::create([
        'supplier_name' => 'Fornecedor Teste',
        'description' => 'Conta para teste de pagamento',
        'amount' => 150.00,
        'original_amount' => 150.00,
        'remaining_amount' => 150.00,
        'due_date' => Carbon::now()->addDays(5)->format('Y-m-d'),
        'status' => 'pending',
        'category' => 'Teste'
    ]);
    
    echo "Conta criada com sucesso! ID: {$account->id}, Status: {$account->status}\n";
    
    // Listar todas as contas pendentes
    $pendingAccounts = AccountsPayable::where('status', 'pending')->get();
    echo "\nContas pendentes:\n";
    foreach($pendingAccounts as $account) {
        echo "ID: {$account->id}, Status: {$account->status}, Fornecedor: {$account->supplier_name}\n";
    }
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
