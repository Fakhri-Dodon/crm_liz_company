<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Requires doctrine/dbal to run ->change()
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status', 100)->default('Draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the original ENUM (keeps the same values as before)
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('Draft','Unpaid','Paid','Partial','Cancelled') NOT NULL DEFAULT 'Draft'");
    }
};
