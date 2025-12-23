<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('quotations', 'subject')) {
                $table->text('subject')->nullable()->after('status');            
            }
            if (!Schema::hasColumn('quotations', 'payment_terms')) {
                $table->text('payment_terms')->nullable()->after('subject');            
            }
            if (!Schema::hasColumn('quotations', 'note')) {
                $table->text('note')->nullable()->after('payment_terms');            
            }
            if (!Schema::hasColumn('quotations', 'payment_terms')) {
                $table->text('revision_note')->nullable()->after('note');
            }
            if (!Schema::hasColumn('quotations', 'note')) {
                $table->string('pdf_path')->nullable()->after('revision_note'); 
            }        
        });
    }

    public function down()
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn([ 'subject', 'payment_terms', 'note', 'revision_note', 'pdf_path']);
        });
    }
};
