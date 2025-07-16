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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->string('payment_method'); // cash, card, pix, credit, transfer
            $table->decimal('amount', 10, 2);
            $table->datetime('payment_date');
            $table->string('status')->default('confirmed'); // pending, confirmed, cancelled, refunded
            $table->string('reference')->nullable(); // Número da transação, cheque, etc
            $table->text('notes')->nullable();
            $table->decimal('change_amount', 10, 2)->default(0); // Troco para pagamento em dinheiro
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
