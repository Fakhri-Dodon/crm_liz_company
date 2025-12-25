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
        Schema::create('proposal_element_template', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            // $table->char('proposal_element_id', 36);
            $table->string('name');
            $table->string('slug')->unique();
            $table->longText('content_json');
            $table->string('preview_image', 255);
            $table->longText('html_output')->nullable();
            $table->longText('css_output')->nullable();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->softDeletes();
            $table->timestamps();

            // $table->foreign('proposal_element_id')->references('id')->on('proposal_elements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_element_template');
    }
};
