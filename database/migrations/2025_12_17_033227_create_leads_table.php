<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->char('id', 36)->primary();

            $table->string('company_name');
            $table->text('address')->nullable();
            $table->string('contact_person', 100);
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();

            $table->enum('status', ['new', 'sent', 'converted'])->default('new');
            $table->string('assigned_to')->nullable();

            $table->char('created_by', 36)->nullable()->index();
            $table->char('updated_by', 36)->nullable()->index();
            $table->char('deleted_by', 36)->nullable()->index();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deleted_at')->nullable();

            $table->boolean('deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
