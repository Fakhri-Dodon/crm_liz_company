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
        Schema::create('proposal_number_formated', function (Blueprint $table) {
            $table->uuid('id')->primary();
             $table->string('prefix')->default('PRO-');
            $table->string('prefix_description')->default('Fixed text added at the beginning of the proposal number.');
            $table->integer('padding')->default(5);
            $table->string('padding_description')->default('Sets the length of the numeric part. Extra zeros are added to maintain consistent length.');
            $table->integer('next_number')->default(1);
            $table->string('next_number_description')->default('The sequential number for the next generated proposal.');
            $table->boolean('deleted')->default(false);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_number_formated');
    }
};
