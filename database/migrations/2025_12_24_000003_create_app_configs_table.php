<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('app_configs', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('company_name', 255)->nullable();
            $table->text('address')->nullable();
            $table->tinyInteger('lead_user_base_visibility')->default(1);
            $table->tinyInteger('lead_default_filter_by_login')->default(1);
            $table->tinyInteger('proposal_user_base_visibility')->default(1);
            $table->tinyInteger('proposal_default_filter_by_login')->default(1);
            $table->string('default_language', 255)->default('Indonesia');
            $table->tinyInteger('allow_language_change')->default(1);
            $table->string('logo_path', 255)->nullable();
            $table->string('doc_logo_path', 255)->nullable();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down() { 
        Schema::dropIfExists('app_configs'); 
    }
};