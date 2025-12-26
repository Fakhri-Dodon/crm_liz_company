<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientTypesTableSeeder extends Seeder
{
    public function run()
    {
        $clientTypes = [
            [
                'id' => (string) Str::uuid(),
                'name' => 'PMDN',
                'information' => 'Penanaman Modal Dalam Negeri',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'PMA',
                'information' => 'Penanaman Modal Asing',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'KPPA',
                'information' => 'Kantor Pusat Perusahaan Asing',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'BUMN',
                'information' => 'Badan Usaha Milik Negara',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('client_type')->insert($clientTypes);
        
        $this->command->info('Client types seeded successfully!');
    }
}