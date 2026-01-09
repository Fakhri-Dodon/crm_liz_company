<?php

namespace Database\Seeders;

use App\Models\QuotationNumberFormated;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QuotationNumberFormatedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        QuotationNumberFormated::create([
            'id' => Str::uuid()->toString(),
        ]);
    }
}
