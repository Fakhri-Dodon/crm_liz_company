<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\LeadStatuses;

class LeadStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $allStatus = [
            [
                'id' => '30f0597e-bf13-4834-b4b9-7d32f267748e', // ID FIXED untuk New
                'name'  => 'New',
                'color' => '#3B82F6',
                'color_name' => 'blue',
                'order' => 1,
                'is_system' => 1
            ],
            [
                'id' => '71917151-2f42-428c-9774-4818d5b46f6b', // ID FIXED untuk Sent
                'name'  => 'Sent',
                'color' => '#22C55E',
                'color_name' => 'Green',
                'order' => 2,
                'is_system' => 1
            ],
        ];

        foreach ($allStatus as $status) {
            LeadStatuses::updateOrCreate(
                ['id' => $status['id']], // Cari berdasarkan ID tetap
                $status
            );
        }
    }
}