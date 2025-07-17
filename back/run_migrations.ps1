# Script PowerShell para executar migrações

Write-Host "=== EXECUTANDO MIGRAÇÕES PARA PAYMENT_DATE ===" -ForegroundColor Green

# Executar migrações usando artisan diretamente
Write-Host "Executando migração para accounts_receivable..." -ForegroundColor Yellow
& .\artisan migrate --path=database/migrations/2025_07_17_140000_add_payment_date_to_accounts_receivable_table.php

Write-Host "Executando migração para accounts_payable..." -ForegroundColor Yellow  
& .\artisan migrate --path=database/migrations/2025_07_17_140001_add_payment_date_to_accounts_payable_table.php

Write-Host "=== MIGRAÇÕES CONCLUÍDAS ===" -ForegroundColor Green

# Verificar se as colunas foram criadas
Write-Host "Verificando se as colunas foram criadas..." -ForegroundColor Yellow

$testScript = @"
require 'vendor/autoload.php';
`$app = require_once 'bootstrap/app.php';
`$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;

echo 'Verificando accounts_receivable...' . PHP_EOL;
`$columns = Schema::getColumnListing('accounts_receivable');
if (in_array('payment_date', `$columns)) {
    echo '✅ Campo payment_date criado na accounts_receivable' . PHP_EOL;
} else {
    echo '❌ Campo payment_date NÃO encontrado na accounts_receivable' . PHP_EOL;
}

echo 'Verificando accounts_payable...' . PHP_EOL;
`$columns = Schema::getColumnListing('accounts_payable');
if (in_array('payment_date', `$columns)) {
    echo '✅ Campo payment_date criado na accounts_payable' . PHP_EOL;
} else {
    echo '❌ Campo payment_date NÃO encontrado na accounts_payable' . PHP_EOL;
}
"@

php -r $testScript

Write-Host "=== TESTE FINALIZADO ===" -ForegroundColor Green
