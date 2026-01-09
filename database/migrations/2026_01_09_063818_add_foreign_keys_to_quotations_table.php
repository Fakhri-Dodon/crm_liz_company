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
        Schema::table('quotations', function (Blueprint $table) {
            $table->foreign('quotation_number_formated_id', 'fk_quotation_fmt_id') 
                ->references('id')->on('quotation_number_formated')
                ->onDelete('cascade');

            $table->foreign('quotation_statuses_id', 'fk_quotation_status_id')
                ->references('id')->on('quotation_statuses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropForeign('fk_quotation_fmt_id');
            $table->dropForeign('fk_quotation_status_id');
        });
    }
};
