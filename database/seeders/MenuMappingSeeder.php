<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MenuMappingSeeder extends Seeder
{
    public function run(): void
    {
        $menus = DB::table('menu')->get();
        $roles = DB::table('roles')->get();

        foreach ($roles as $role) {
            foreach ($menus as $menu) {
                // Default: Semua akses mati (0)
                $c = 0; $r = 0; $u = 0; $d = 0;

                // ADMIN: Full Access (Semua C, R, U, D bernilai 1)
                if ($role->name === 'Admin') {
                    $c = 1; $r = 1; $u = 1; $d = 1;
                }

                // MANAGER
                if ($role->name === 'Manager') {
                    if ($menu->name === 'USER') { $c = 1; $r = 1; $u = 1; $d = 1; }
                    if (in_array($menu->name, ['CLIENTS', 'LEAD', 'PROJECT', 'EMAIL', 'Setting'])) { $c = 1; $r = 1; $u = 1; $d = 1; }
                    if (in_array($menu->name, ['PROPOSAL', 'QUOTATION', 'INVOICE', 'PAYMENT'])) { $r = 1; }
                }

                // MARKETING
                if ($role->name === 'Marketing') {
                    if ($menu->name === 'USER') { $r = 1; }
                    if (in_array($menu->name, ['CLIENTS', 'LEAD', 'PROPOSAL', 'QUOTATION'])) { $c = 1; $r = 1; $u = 1; }
                    if (in_array($menu->name, ['INVOICE', 'PAYMENT', 'PROJECT', 'EMAIL'])) { $r = 1; }
                }

                // FINANCE
                if ($role->name === 'Finance') {
                    if (in_array($menu->name, ['USER', 'CLIENTS', 'LEAD', 'PROPOSAL', 'QUOTATION', 'PROJECT', 'EMAIL'])) { $r = 1; }
                    if (in_array($menu->name, ['INVOICE', 'PAYMENT'])) { $c = 1; $r = 1; $u = 1; }
                }

                // Insert data mapping
                DB::table('menu_mapping')->insert([
                    'id' => Str::uuid()->toString(),
                    'role_id' => $role->id,
                    'menu_id' => $menu->id,
                    'can_create' => $c,
                    'can_read'   => $r,
                    'can_update' => $u,
                    'can_delete' => $d,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}