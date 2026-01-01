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
        // Alter ENUM to add 'Partial' status
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('Draft', 'Paid', 'Invoice', 'Unpaid', 'Partial', 'Cancelled') DEFAULT 'Draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'Partial' from ENUM
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('Draft', 'Paid', 'Invoice', 'Unpaid', 'Cancelled') DEFAULT 'Draft'");
    }
};
