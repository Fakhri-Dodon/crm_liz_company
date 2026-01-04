<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up() {
        Schema::create('leads', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('lead_statuses_id', 36);
            $table->string('company_name');
            $table->text('address')->nullable();
            $table->string('contact_person', 100);
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('position', 100)->nullable();
            $table->string('assigned_to', 100)->nullable();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('lead_statuses_id')->references('id')->on('lead_statuses');
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
