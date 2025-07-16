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
        Schema::table('quotes', function (Blueprint $table) {
            // First drop the constraint
            $table->dropColumn('status');
        });

        Schema::table('quotes', function (Blueprint $table) {
            // Add the column with new enum values
            $table->enum('status', ['pending', 'approved', 'in_progress', 'completed', 'paid', 'rejected', 'expired'])
                  ->default('pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'expired'])
                  ->default('pending');
        });
    }
};
