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
            $table->string('city')->nullable(); // HAPUS 'after('address')'
            $table->string('province')->nullable(); // HAPUS 'after('city')'
            $table->string('country')->nullable(); // HAPUS 'after('province')'
            $table->string('contact_person');
            $table->string('position')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->date('client_since')->nullable();
            $table->unsignedBigInteger('postal_code')->nullable();
            $table->unsignedBigInteger('vat_number')->nullable();
            $table->string('nib')->nullable(); // HAPUS 'after('vat_number')'
            $table->string('website')->nullable(); // HAPUS 'after('nib')'
            $table->string('logo_path')->nullable(); // HAPUS 'after('website')'
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