<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (!Schema::hasColumn('leads', 'converted_to_company')) {
                $table->boolean('converted_to_company')->default(false)->after('status');
            }
            
            if (!Schema::hasColumn('leads', 'converted_at')) {
                $table->timestamp('converted_at')->nullable()->after('converted_to_company');
            }
            
            if (!Schema::hasColumn('leads', 'company_id')) {
                $table->char('company_id', 36)->nullable()->after('converted_at');
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'company_id')) {
                $table->dropForeign(['company_id']);
            }
            
            $columnsToDrop = ['converted_to_company', 'converted_at', 'company_id'];
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('leads', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};