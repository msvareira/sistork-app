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
        Schema::create('accounts_receivable', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('document_number'); // Número do documento/título
            $table->decimal('original_amount', 10, 2);
            $table->decimal('remaining_amount', 10, 2);
            $table->date('due_date');
            $table->date('issue_date');
            $table->string('status'); // pending, partial, paid, overdue, cancelled
            $table->string('type')->default('sale'); // sale, service, other
            $table->text('description');
            $table->text('notes')->nullable();
            $table->decimal('interest_rate', 5, 2)->default(0); // Taxa de juros mensal
            $table->decimal('fine_rate', 5, 2)->default(0); // Taxa de multa
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts_receivable');
    }
};
