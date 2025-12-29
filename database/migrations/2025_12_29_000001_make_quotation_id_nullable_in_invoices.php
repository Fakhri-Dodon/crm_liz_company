<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // drop FK, change column to nullable, then re-add FK with ON DELETE SET NULL
            $table->dropForeign(['quotation_id']);
            $table->char('quotation_id', 36)->nullable()->change();
            $table->foreign('quotation_id')->references('id')->on('quotations')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['quotation_id']);
            $table->char('quotation_id', 36)->nullable(false)->change();
            $table->foreign('quotation_id')->references('id')->on('quotations');
        });
    }
};
