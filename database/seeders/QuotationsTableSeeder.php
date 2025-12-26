<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Lead;

class QuotationsTableSeeder extends Seeder
{
    public function run()
    {
        // Cek apakah sudah ada data
        $count = DB::table('quotations')->count();
        
        if ($count === 0) {
            // Cari lead yang ada atau buat baru
            $lead = Lead::first();
            
            if (!$lead) {
                // Buat lead dulu jika belum ada
                $lead = Lead::create([
                    'id' => (string) Str::uuid(),
                    'company_name' => 'PT. Contoh Perusahaan',
                    'contact_person' => 'John Doe',
                    'email' => 'john@contoh.com',
                    'phone' => '081234567890',
                    'status' => 'new',
                    'converted_to_company' => false,
                    'created_by' => 1, // user ID
                    'deleted' => 0
                ]);
            }
            
            $quotations = [
                [
                    'id' => (string) Str::uuid(),
                    'lead_id' => $lead->id,
                    'quotation_number' => 'QUO-' . date('Y') . '-001',
                    'status' => 'accepted',
                    'subject' => 'Website Development Project',
                    'payment_terms' => '50% advance, 50% on completion',
                    'note' => 'Project includes frontend and backend development',
                    'revision_note' => null,
                    'pdf_path' => null,
                    'subtotal' => 15000000,
                    'discount' => 1000000,
                    'tax' => 1400000,
                    'total' => 15400000,
                    'accepted_at' => now(),
                    'accepted_by' => 1, // user ID
                    'created_by' => 1,
                    'deleted' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'id' => (string) Str::uuid(),
                    'lead_id' => $lead->id,
                    'quotation_number' => 'QUO-' . date('Y') . '-002',
                    'status' => 'accepted',
                    'subject' => 'Mobile App Development',
                    'payment_terms' => '30% advance, 40% on milestone, 30% on delivery',
                    'note' => 'iOS and Android app development',
                    'revision_note' => null,
                    'pdf_path' => null,
                    'subtotal' => 25000000,
                    'discount' => 2000000,
                    'tax' => 2300000,
                    'total' => 25300000,
                    'accepted_at' => now()->subDays(5),
                    'accepted_by' => 1,
                    'created_by' => 1,
                    'deleted' => 0,
                    'created_at' => now()->subDays(10),
                    'updated_at' => now()->subDays(5)
                ],
                [
                    'id' => (string) Str::uuid(),
                    'lead_id' => $lead->id,
                    'quotation_number' => 'QUO-' . date('Y') . '-003',
                    'status' => 'sent', // Status bukan accepted
                    'subject' => 'Digital Marketing Services',
                    'payment_terms' => 'Monthly payment',
                    'note' => 'SEO and Social Media Marketing',
                    'revision_note' => null,
                    'pdf_path' => null,
                    'subtotal' => 8000000,
                    'discount' => 500000,
                    'tax' => 750000,
                    'total' => 8250000,
                    'accepted_at' => null, // Belum accepted
                    'accepted_by' => null,
                    'created_by' => 1,
                    'deleted' => 0,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(2)
                ]
            ];

            DB::table('quotations')->insert($quotations);
            
            $this->command->info('Quotations seeded successfully! (' . count($quotations) . ' records)');
            $this->command->info('2 accepted quotations created for testing.');
        } else {
            $acceptedCount = DB::table('quotations')->where('status', 'accepted')->count();
            $this->command->info('Quotations already exist (' . $count . ' records).');
            $this->command->info('Accepted quotations: ' . $acceptedCount);
            
            // Jika tidak ada yang accepted, buat beberapa
            if ($acceptedCount === 0) {
                $lead = Lead::first();
                if ($lead) {
                    $newQuotation = [
                        'id' => (string) Str::uuid(),
                        'lead_id' => $lead->id,
                        'quotation_number' => 'QUO-' . date('Y') . '-TEST',
                        'status' => 'accepted',
                        'subject' => 'Test Quotation for Client Creation',
                        'payment_terms' => 'Test terms',
                        'note' => 'This is a test quotation for creating clients',
                        'revision_note' => null,
                        'pdf_path' => null,
                        'subtotal' => 10000000,
                        'discount' => 0,
                        'tax' => 1000000,
                        'total' => 11000000,
                        'accepted_at' => now(),
                        'accepted_by' => 1,
                        'created_by' => 1,
                        'deleted' => 0,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                    
                    DB::table('quotations')->insert($newQuotation);
                    $this->command->info('Added 1 accepted quotation for testing.');
                }
            }
        }
    }
}