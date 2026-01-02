<?php

namespace Database\Seeders;

use App\Models\Proposal;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            UserSeeder::class,
            ClientTypeSeeder::class,
            MenuSeeder::class,
            ProposalNumberFormatedSeeder::class,
            // QuotationsTableSeeder::class,
            AppConfigsSeeder::class,
            LeadStatusesSeeder::class,
            ProposalStatusesSeeder::class,
            EmailTemplateSeeder::class,
            MenuMappingSeeder::class,
        ]);
    }
}
