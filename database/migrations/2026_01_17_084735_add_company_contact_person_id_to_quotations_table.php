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
        Schema::table('quotations', function (Blueprint $table) {
            // Menambahkan kolom setelah lead_id
            $table->char('company_contact_person_id', 36)
                  ->nullable() // Dibuat nullable agar aman untuk data yang sudah ada
                  ->after('lead_id')
                  ->index(); // Menambahkan index untuk performa query

            $table->foreign('company_contact_person_id')->references('id')->on('company_contact_persons');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            // Hapus foreign key dulu jika Anda mengaktifkannya di method up()
            // $table->dropForeign(['company_contact_person_id']);
            
            $table->dropColumn('company_contact_person_id');
        });
    }
};