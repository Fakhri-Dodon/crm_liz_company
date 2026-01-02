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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained(); // Siapa yang melakukan
            $table->string('module'); // 'Leads', 'Clients', 'Invoices', dsb.
            $table->string('action'); // 'Created', 'Updated', 'Deleted'
            $table->string('description'); // Detail: "Membuat Invoice INV-001"
            $table->timestamps();
            $table->tinyInteger('deleted')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
