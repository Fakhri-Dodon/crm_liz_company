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
        Schema::create('leads', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            
            // Status relationship
            $table->char('lead_statuses_id', 36);
            
            // Company information
            $table->string('company_name');
            $table->text('address')->nullable();
            $table->string('contact_person', 100);
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('position', 100)->nullable();
            
            // Assignment
            $table->char('assigned_to', 36)->nullable(); // Ubah dari string(100) ke char(36)
            
            // Conversion fields - TAMBAHKAN INI
            $table->boolean('converted_to_company')->default(false);
            $table->timestamp('converted_at')->nullable();
            $table->char('company_id', 36)->nullable(); // Reference to companies table
            
            // Audit trail
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            
            // Soft delete flags
            $table->tinyInteger('deleted')->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('lead_statuses_id')->references('id')->on('lead_statuses')->onDelete('restrict');
            
            // TAMBAHKAN foreign key untuk company_id
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
            
            // TAMBAHKAN foreign key untuk assigned_to (users table)
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            
            // Optional: Add indexes for performance
            $table->index('deleted');
            $table->index('converted_to_company');
            $table->index('company_id');
            $table->index('assigned_to');
            $table->index(['deleted', 'converted_to_company']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};