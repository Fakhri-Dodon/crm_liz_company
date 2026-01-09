<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InvoiceStatuses;
use Illuminate\Support\Str;

class InvoiceStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
                $allStatus = [
            [
                'name'  => 'Sent',
                'color' => '#3B82F6',
                'color_name'    => 'blue'
            ],
            [
                'name'  => 'Approved',
                'color' => '#22C55E',
                'color_name'    => 'Green'
            ],
            [
                'name'  => 'Opened',
                'color' => '#22C55E',
                'color_name'    => 'Green'
            ],
            [
                'name'  => 'Rejected',
                'color' => '#ef4444',
                'color_name'    => 'Red'
            ],
            [
                'name'  => 'Revised',
                'color' => '#ef4444',
                'color_name'    => 'Red'
            ],
            [
                'name'  => 'Failed',
                'color' => '#F97316',
                'color_name'    => 'Orange'
            ],
            [
                'name'  => 'Draft',
                'color' => '#6B7280',
                'color_name'    => 'Grey'
            ],
        ];

        foreach ($allStatus as $status) {
            InvoiceStatuses::create([
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
