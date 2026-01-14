<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentType;

class PaymentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Down Payment', 'slug' => 'down_payment', 'note' => 'Partial payment / down payment', 'order' => 5, 'is_system' => false],
            ['name' => 'Full Payment', 'slug' => 'full_payment', 'note' => 'Full payment', 'order' => 6, 'is_system' => false],
        ];

        foreach ($types as $t) {
            PaymentType::firstOrCreate(['slug' => $t['slug']], $t);
        }
    }
}
