<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('users', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('role_id', 36);
            $table->string('name', 100);
            $table->string('position', 100);
            $table->string('password', 255);
            $table->string('email', 100)->unique();
            $table->string('phone', 20)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->timestamp('last_seen')->nullable();
            $table->rememberToken();
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('role_id')->references('id')->on('roles');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down() { 
        Schema::dropIfExists('users'); 
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};