// database/migrations/2024_01_01_000002_create_companies_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('client_type_id', 36);
            $table->char('lead_id', 36)->nullable()->unique();
            $table->char('quotation_id', 36)->nullable();
            $table->string('client_code', 50)->nullable();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('contact_person');
            $table->string('position')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->date('client_since')->nullable();
            $table->unsignedBigInteger('postal_code')->nullable();
            $table->unsignedBigInteger('vat_number')->nullable();
            $table->boolean('is_active')->default(true);
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->boolean('deleted')->default(false);
            $table->timestamps();

            // Foreign keys
            $table->foreign('client_type_id')->references('id')->on('client_type');
            $table->foreign('lead_id')->references('id')->on('leads');
            $table->foreign('quotation_id')->references('id')->on('quotations');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};