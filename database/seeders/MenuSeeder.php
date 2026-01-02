<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $allMenus = [
            // Header Menus
            ['name' => 'Setting', 'route' => '/setting/general'],
            
            // Main Menus
            ['name' => 'DASHBOARD', 'route' => '/dashboard'],
            ['name' => 'CLIENTS', 'route' => '/companies'],
            ['name' => 'LEAD', 'route' => '/lead'],
            ['name' => 'PROPOSAL', 'route' => '/proposal'],
            ['name' => 'QUOTATION', 'route' => '/quotation'],
            ['name' => 'INVOICE', 'route' => '/invoice'],
            ['name' => 'PAYMENT', 'route' => '/payment'],
            ['name' => 'PROJECT', 'route' => '/projects'],
            ['name' => 'EMAIL', 'route' => '/email'],
            ['name' => 'USER', 'route' => '/user'],
        ];

        foreach ($allMenus as $menu) {
            DB::table('menu')->insert([
                'id' => Str::uuid()->toString(), // Generate UUID otomatis
                'name' => $menu['name'],
                'route' => $menu['route'],
                'created_at' => now(),
                'updated_at' => now(),
                'deleted' => 0
            ]);
        }
    }
}