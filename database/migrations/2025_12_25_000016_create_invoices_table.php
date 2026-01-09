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
        Schema::create('invoices', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('quotation_id', 36);
            $table->char('company_contact_persons_id', 36);
            $table->char('invoice_number_formated_id', 36);
            $table->char('invoice_statuses_id', 36);
            $table->string('invoice_number', 50);
            $table->date('date');
            $table->integer('invoice_amout');
            $table->string('payment_terms');
            $table->string('payment_type', 100);
            $table->decimal('payment_percentage', 10, 0)->nullable();
            $table->string('note', 255);
            $table->decimal('ppn', 10, 0)->nullable();
            $table->decimal('pph', 10, 0)->nullable();
            $table->decimal('total', 10, 0)->nullable();
            $table->integer('amount_due');
            $table->enum('status', ['Draft', 'Paid', 'Invoice', 'Unpaid', 'Cancelled'])->default('Draft');
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();
            $table->char('deleted_by', 36)->nullable();
            $table->tinyInteger('deleted')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('company_contact_persons_id')->references('id')->on('company_contact_persons');
            $table->foreign('quotation_id')->references('id')->on('quotations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
