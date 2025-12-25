<?php

namespace Database\Seeders;

use App\Models\ProposalNumberFormatted;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProposalNumberFormatedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ProposalNumberFormatted::create([
            'id' => Str::uuid()->toString(),
        ]);
    }
}
