<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;   // <--- WAJIB ADA INI
use Illuminate\Support\Facades\Hash; // <--- Tambahkan juga ini jika Anda menginput password
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {   
        $roles = [
            [
                'name' => 'Admin',
                'description' => 'Mengelola data operasional dan user.',
            ],
            [
                'name' => 'Manager',
                'description' => '',
            ],
            [
                'name' => 'Finance',
                'description' => '',
            ],
            [
                'name' => 'Marketing',
                'description' => '',
            ],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert([
                'id' => Str::uuid()->toString(),
                'name' => $role['name'],
                'description' => $role['description'], 
                'created_at' => now(),
                'updated_at' => now(),
                'deleted' => 0,
            ]);
        }

        $adminRole = \App\Models\Roles::where('name', 'Admin')->first();
        if (! $adminRole) {
            $adminRole = \App\Models\Roles::create(['name' => 'Admin', 'description' => 'Default admin role']);
        }

        \App\Models\User::firstOrCreate([
            'email' => 'admin@example.com',
        ], [
            'id' => Str::uuid()->toString(),
            'name' => 'Admin',
            'password' => bcrypt('Tanyadodon'),
            'role_id' => $adminRole->id,
            'position' => 'Admin',
            'phone' => '086753423456',
            'created_by' => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
