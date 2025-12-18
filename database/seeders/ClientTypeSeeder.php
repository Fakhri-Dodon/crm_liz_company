<?php

namespace Database\Seeders;

use App\Models\ClientType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClientTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Nonaktifkan foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Kosongkan tabel
        ClientType::truncate();
        
        // Aktifkan kembali foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $clientTypes = [
            [
                'id' => '550e8400-e29b-41d4-a716-446655440001',
                'name' => 'Corporate',
                'information' => 'Large corporation clients',
                'deleted' => 0
            ],
            [
                'id' => '550e8400-e29b-41d4-a716-446655440002',
                'name' => 'Small Business',
                'information' => 'Small and medium enterprises',
                'deleted' => 0
            ],
            [
                'id' => '550e8400-e29b-41d4-a716-446655440003',
                'name' => 'Startup',
                'information' => 'Newly established companies',
                'deleted' => 0
            ],
            [
                'id' => '550e8400-e29b-41d4-a716-446655440004',
                'name' => 'Government',
                'information' => 'Government agencies',
                'deleted' => 0
            ],
            [
                'id' => '550e8400-e29b-41d4-a716-446655440005',
                'name' => 'Non-Profit',
                'information' => 'Non-profit organizations',
                'deleted' => 0
            ],
            [
                'id' => '550e8400-e29b-41d4-a716-446655440006',
                'name' => 'Individual',
                'information' => 'Individual clients',
                'deleted' => 0
            ],
        ];

        foreach ($clientTypes as $clientType) {
            ClientType::create([
                'id' => $clientType['id'],
                'name' => $clientType['name'],
                'information' => $clientType['information'],
                'created_by' => '1', // Asumsi user dengan ID 1 ada
                'updated_by' => '1',
                'deleted' => $clientType['deleted']
            ]);
        }
    }
}