#!/bin/bash

echo "=== EXECUTANDO MIGRAÇÕES PARA PAYMENT_DATE ==="

# Executa as migrações
echo "Executando migração para accounts_receivable..."
php artisan migrate --path=database/migrations/2025_07_17_140000_add_payment_date_to_accounts_receivable_table.php

echo "Executando migração para accounts_payable..."
php artisan migrate --path=database/migrations/2025_07_17_140001_add_payment_date_to_accounts_payable_table.php

echo "=== MIGRAÇÕES CONCLUÍDAS ==="

# Testar se as migrações funcionaram
echo "Testando as tabelas..."
php -r "
require 'vendor/autoload.php';
\$app = require_once 'bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo 'Verificando colunas da tabela accounts_receivable...' . PHP_EOL;
\$columns = Schema::getColumnListing('accounts_receivable');
if (in_array('payment_date', \$columns)) {
    echo '✅ Campo payment_date adicionado com sucesso na accounts_receivable' . PHP_EOL;
} else {
    echo '❌ Campo payment_date NÃO encontrado na accounts_receivable' . PHP_EOL;
}

echo 'Verificando colunas da tabela accounts_payable...' . PHP_EOL;
\$columns = Schema::getColumnListing('accounts_payable');
if (in_array('payment_date', \$columns)) {
    echo '✅ Campo payment_date adicionado com sucesso na accounts_payable' . PHP_EOL;
} else {
    echo '❌ Campo payment_date NÃO encontrado na accounts_payable' . PHP_EOL;
}
"

echo "=== TESTE FINALIZADO ==="
