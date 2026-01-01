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
        Schema::create('proposals', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('proposal_number_formated_id', 36);
            $table->char('proposal_statuses_id', 36);
            $table->char('proposal_element_template_id', 36);
            $table->char('lead_id', 36);
            $table->string('proposal_number', 50);
            $table->string('title');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->enum('status', ['draft', 'sent', 'opened', 'rejected', 'failed', 'approved', 'revised'])->default('draft');
            $table->longText('content_json');
            $table->string('view_token', 100)->unique();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('proposal_number_formated_id')->references('id')->on('proposal_number_formated');
            $table->foreign('proposal_statuses_id')->references('id')->on('proposal_statuses');
            $table->foreign('proposal_element_template_id')->references('id')->on('proposal_element_template');
            $table->foreign('lead_id')->references('id')->on('leads');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal');
    }
};
