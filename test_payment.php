<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Http\Request;
use App\Http\Controllers\AccountsPayableController;
use App\Models\AccountsPayable;

// Configurar o ambiente Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    // Buscar a conta pendente
    $account = AccountsPayable::find(1);
    
    if (!$account) {
        echo "Conta não encontrada.\n";
        exit;
    }
    
    echo "=== TESTE DE PAGAMENTO COM JUROS ===\n";
    echo "Conta antes do pagamento:\n";
    echo "- Original Amount: R$ " . number_format($account->original_amount, 2, ',', '.') . "\n";
    echo "- Remaining Amount: R$ " . number_format($account->remaining_amount, 2, ',', '.') . "\n";
    echo "- Status: " . $account->status . "\n";
    echo "\n";
    
    // Simular um request com juros (pagamento insuficiente)
    $requestData = [
        'payment_amount' => 105.00, // Valor do pagamento: R$ 105,00 (insuficiente)
        'payment_date' => '2025-07-19',
        'discount_amount' => 0,
        'interest_amount' => 10.00, // Juros de R$ 10,00
        'notes' => 'Pagamento com juros de teste - insuficiente'
    ];
    
    echo "Dados do pagamento:\n";
    echo "- Valor do pagamento: R$ " . number_format($requestData['payment_amount'], 2, ',', '.') . "\n";
    echo "- Juros: R$ " . number_format($requestData['interest_amount'], 2, ',', '.') . "\n";
    echo "- Valor total da conta com juros: R$ " . number_format($account->remaining_amount + $requestData['interest_amount'], 2, ',', '.') . "\n";
    echo "\n";
    
    // Verificar se o pagamento é suficiente para cobrir conta + juros
    $accountTotalWithCharges = $account->remaining_amount + $requestData['interest_amount'];
    
    if ($requestData['payment_amount'] >= $accountTotalWithCharges) {
        echo "✅ Pagamento de R$ " . number_format($requestData['payment_amount'], 2, ',', '.') . 
             " é suficiente para cobrir R$ " . number_format($accountTotalWithCharges, 2, ',', '.') . "\n";
    } else {
        echo "❌ Pagamento de R$ " . number_format($requestData['payment_amount'], 2, ',', '.') . 
             " NÃO é suficiente para cobrir R$ " . number_format($accountTotalWithCharges, 2, ',', '.') . "\n";
    }
    
    echo "\nTeste de validação concluído.\n";
    
} catch (\Exception $e) {
    echo "Erro no teste: " . $e->getMessage() . "\n";
}
