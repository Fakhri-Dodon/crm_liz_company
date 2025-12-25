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
        Schema::create('companies', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('client_type_id', 36);
            $table->char('lead_id', 36);
            $table->char('quotation_id', 36);
            $table->string('client_code', 50)->nullable();
            $table->date('client_since')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('country')->nullable();
            $table->unsignedBigInteger('postal_code')->nullable();
            $table->unsignedBigInteger('vat_number')->nullable();
            $table->string('nib')->nullable();
            $table->string('website')->nullable();
            $table->string('logo_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('client_type_id')->references('id')->on('client_type');
            $table->foreign('lead_id')->references('id')->on('leads');
            $table->foreign('quotation_id')->references('id')->on('quotations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
