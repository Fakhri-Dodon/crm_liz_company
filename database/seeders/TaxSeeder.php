<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Ppn;
use App\Models\Pph;
use Illuminate\Support\Str;

class TaxSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $allPpn = [
            [
                'name'  => '11%',
                'rate' => 0.11,
            ],
            [
                'name'  => '12%',
                'rate' => 0.12,
            ],
        ];

        $allPph = [
            [
                'name'  => '11%',
                'rate' => 0.11,
            ],
            [
                'name'  => '12%',
                'rate' => 0.12,
            ],
        ];

        foreach ($allPpn as $ppn) {
            Ppn::create([
                'id' => Str::uuid()->toString(),
                'name' => $ppn['name'],
                'rate' => $ppn['rate'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ($allPph as $pph) {
            Pph::create([
                'id' => Str::uuid()->toString(),
                'name' => $pph['name'],
                'rate' => $pph['rate'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
