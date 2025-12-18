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
        Schema::create('app_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('company_name')->nullable();
            $table->text('address')->nullable();
            $table->boolean('lead_user_base_visibility')->default(true)->nullable();
            $table->boolean('lead_default_filter_by_login')->default(true)->nullable();
            $table->boolean('proposal_user_base_visibility')->default(true)->nullable();
            $table->boolean('proposal_default_filter_by_login')->default(true)->nullable();
            $table->string('default_language')->default('Indonesia');
            $table->boolean('allow_language_change')->default(true);
            $table->string('logo_path')->nullable();
            $table->string('doc_logo_path')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
            $table->boolean('deleted')->default(false);
            $table->softDeletes(); 
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_configs');
    }
};
