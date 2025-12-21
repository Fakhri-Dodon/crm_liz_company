<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
  
        Schema::create('quotations', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('lead_id', 36)->nullable();
            $table->string('quotation_number', 50);
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected'])->default('draft');
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('discount', 15, 2)->default(0.00);
            $table->decimal('tax', 15, 2)->default(0.00);
            $table->decimal('total', 15, 2)->default(0.00);
            $table->timestamp('accepted_at')->nullable();
            $table->unsignedBigInteger('accepted_by')->nullable();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
            $table->tinyInteger('deleted')->default(0);

            // Indexes
            $table->index('lead_id');
            $table->index('quotation_number');
            $table->index('status');
            $table->index('accepted_by');
            $table->index('created_by');
            $table->index('updated_by');
            $table->index('deleted_by');
            $table->index('deleted');
        });


    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};