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
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreign('invoice_number_formated_id', 'fk_invoice_fmt_id') 
                ->references('id')->on('invoice_number_formated')
                ->onDelete('cascade');

            $table->foreign('invoice_statuses_id', 'fk_invoice_status_id')
                ->references('id')->on('invoice_statuses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign('fk_invoice_fmt_id');
            $table->dropForeign('fk_invoice_status_id');
        });
    }
};
