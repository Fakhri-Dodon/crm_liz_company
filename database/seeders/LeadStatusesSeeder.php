<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\LeadStatuses;
use Illuminate\Support\Str;

class LeadStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $allStatus = [
            [
                'name'  => 'New',
                'color' => '#3B82F6',
                'color_name'    => 'blue'
            ],
            [
                'name'  => 'Sent',
                'color' => '#22C55E',
                'color_name'    => 'Green'
            ],
        ];

        foreach ($allStatus as $status) {
            LeadStatuses::create([
                'id' => Str::uuid()->toString(),
                'name' => $status['name'],
                'color' => $status['color'],
                'color_name' => $status['color_name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
