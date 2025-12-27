<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AppConfig;
use Illuminate\Support\Str;

class AppConfigsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AppConfig::create([
            'id' => Str::uuid()->toString(),
        ]);
    }
}
