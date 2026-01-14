<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Invoice;
use App\Models\InvoiceStatuses;
use App\Models\LeadStatuses;
use App\Models\Lead;
use App\Models\CompanyContactPerson;
use App\Models\QuotationStatuses;
use App\Models\Quotation;
use Illuminate\Support\Str;

class InvoiceStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_status_with_status_id_updates_invoice_status()
    {
        // Create a user and required related records
        $user = User::factory()->create();

        $leadStatus = LeadStatuses::create(['name' => 'New']);
        $lead = Lead::create([
            'lead_statuses_id' => $leadStatus->id,
            'company_name' => 'Test Co',
            'contact_person' => 'Tester'
        ]);

        $contact = CompanyContactPerson::create([
            'lead_id' => $lead->id,
            'name' => 'Contact Person',
            'is_primary' => 1,
            'is_active' => 1
        ]);

        $quotationStatus = QuotationStatuses::create(['name' => 'draft']);
        $quotation = Quotation::create([
            'lead_id' => $lead->id,
            'quotation_number_formated_id' => Str::uuid()->toString(),
            'quotation_statuses_id' => $quotationStatus->id,
            'quotation_number' => 'Q-001',
            'date' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
            'subject' => 'Subject',
            'payment_terms' => 'Net 30',
            'pdf_path' => 'path.pdf',
            'subtotal' => 0,
            'discount' => 0,
            'tax' => 0,
            'total' => 0,
        ]);

        $draft = InvoiceStatuses::create(['name' => 'Draft']);
        $approved = InvoiceStatuses::create(['name' => 'Approved']);

        $invoice = Invoice::create([
            'quotation_id' => $quotation->id,
            'company_contact_persons_id' => $contact->id,
            'invoice_number_formated_id' => Str::uuid()->toString(),
            'invoice_statuses_id' => $draft->id,
            'invoice_number' => 'INV-001',
            'date' => now()->toDateString(),
            'invoice_amout' => 1000,
            'payment_terms' => 'Net 30',
            'payment_type' => 'transfer',
            'payment_percentage' => 0,
            'note' => '',
            'ppn' => 0,
            'pph' => 0,
            'total' => 1000,
            'amount_due' => 1000,
            'status' => 'Draft',
        ]);

        $response = $this->actingAs($user)
            ->patch(route('invoice.update-status', $invoice->id), [
                'status_id' => $approved->id
            ]);

        $response->assertStatus(302);

        $invoice->refresh();

        $this->assertEquals($approved->id, $invoice->invoice_statuses_id);
        $this->assertEquals('Approved', $invoice->status);
    }
}
