<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accounts_payable', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_name');
            $table->string('supplier_document')->nullable(); // CNPJ/CPF do fornecedor
            $table->string('document_number'); // Número da nota fiscal/documento
            $table->decimal('original_amount', 10, 2);
            $table->decimal('remaining_amount', 10, 2);
            $table->date('due_date');
            $table->date('issue_date');
            $table->string('status'); // pending, partial, paid, overdue, cancelled
            $table->string('type')->default('purchase'); // purchase, expense, service, other
            $table->string('category')->nullable(); // Categoria da despesa
            $table->text('description');
            $table->text('notes')->nullable();
            $table->decimal('interest_amount', 10, 2)->default(0); // Juros pagos
            $table->decimal('discount_amount', 10, 2)->default(0); // Desconto obtido
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts_payable');
    }
};
