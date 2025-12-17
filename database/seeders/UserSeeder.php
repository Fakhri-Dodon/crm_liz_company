<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Role::firstOrCreate([
            'name' => 'admin',
        ], [
            'description' => 'Administrator',
        ]);

        $adminRole = \App\Models\Role::where('name', 'admin')->first();

        \App\Models\User::firstOrCreate([
            'email' => 'admin@example.com',
        ], [
            'name' => 'Admin',
            'password' => bcrypt('password'),
            'role_id' => $adminRole->id,
        ]);
    }
}
