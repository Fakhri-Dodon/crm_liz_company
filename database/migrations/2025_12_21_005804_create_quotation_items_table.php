<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->char('id', 36)->primary();
            $table->char('quotation_id', 36);
            $table->string('processing');
            $table->decimal('amount', 15,2)->default(0);
            $table->text('description');
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
            $table->tinyInteger('deleted')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};