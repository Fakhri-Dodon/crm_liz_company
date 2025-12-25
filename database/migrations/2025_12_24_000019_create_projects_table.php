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
        Schema::create('projects', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('quotation_id', 36);
            $table->char('client_id', 36);
            $table->char('user_id', 36)->nullable();
            $table->string('project_description', 250)->nullable();
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['in_progress', 'completed', 'pending', 'cancelled'])->default('in_progress');
            $table->string('note', 250)->nullable();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable()->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->tinyInteger('deleted')->default(0);

            // Indexes
            $table->index('quotation_id');
            $table->index('client_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('start_date');
            $table->index('deadline');
            $table->index('created_by');
            $table->index('updated_by');
            $table->index('deleted_by');
            $table->index('deleted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
