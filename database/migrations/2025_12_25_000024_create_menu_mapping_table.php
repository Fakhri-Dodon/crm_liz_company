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
        Schema::create('menu_mapping', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('role_id', 36);
            $table->char('menu_id', 36);
            $table->tinyInteger('can_create')->default(0);
            $table->tinyInteger('can_read')->default(0);
            $table->tinyInteger('can_update')->default(0);
            $table->tinyInteger('can_delete')->default(0);
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('role_id')->references('id')->on('roles');
            $table->foreign('menu_id')->references('id')->on('menu');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_mapping');
    }
};
