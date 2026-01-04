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
        Schema::create('company_contact_persons', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('company_id', 36)->nullable();
            $table->char('lead_id', 36)->nullable();
            
            $table->string('name', 100);
            $table->string('email', 100); 
            $table->string('phone', 50)->nullable();
            $table->string('position', 100)->nullable();
            
            $table->boolean('is_primary')->default(0);
            $table->boolean('is_active')->default(1);
            
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('company_id')->references('id')->on('companies');
            $table->foreign('lead_id')->references('id')->on('leads');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_contact_persons');
    }
};
