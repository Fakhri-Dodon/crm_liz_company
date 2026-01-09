<?php

namespace Database\Seeders;

use App\Models\InvoiceNumberFormated;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InvoiceNumberFormatedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        InvoiceNumberFormated::create([
            'id' => Str::uuid()->toString(),
        ]);
    }
}
