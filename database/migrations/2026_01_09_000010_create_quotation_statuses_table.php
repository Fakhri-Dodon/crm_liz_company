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
        Schema::create('quotation_statuses', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('name');
            $table->text('note')->nullable();
            $table->string('color');
            $table->string('color_name', 100);
            $table->integer('order')->default(0);
            $table->boolean('is_system')->default(0);
            $table->tinyInteger('deleted')->default(0);
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_statuses');
    }
};
