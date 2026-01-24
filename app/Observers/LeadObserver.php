<?php

namespace App\Observers;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadObserver
{
    /**
     * Handle the Lead "deleting" event.
     */
    public function deleting(Lead $lead): void
    {
        try {
            DB::beginTransaction();
            
            Log::info('=== LEAD OBSERVER: DELETING PROCESS STARTED ===');
            Log::info("Lead ID: {$lead->id}");
            Log::info("Lead Name: {$lead->company_name}");
            
            // ==================== 1. DELETE PAYMENTS (melalui invoices → quotations) ====================
            $this->deletePaymentsThroughQuotations($lead);
            
            // ==================== 2. DELETE INVOICES (melalui quotations) ====================
            $this->deleteInvoicesThroughQuotations($lead);
            
            // ==================== 3. DELETE QUOTATIONS ====================
            $this->deleteQuotations($lead);
            
            $this->deleteProposals($lead);
            
            // ==================== 4. DELETE PROJECTS (melalui company atau quotations) ====================
            $this->deleteProjectsThroughChain($lead);
            
            // ==================== 5. DELETE COMPANY ====================
            $this->deleteCompany($lead);
            
            // ==================== 6. DELETE CONTACTS ====================
            $this->deleteContacts($lead);
            
            // ==================== 7. UPDATE LEAD FLAG (akan disimpan otomatis oleh Laravel) ====================
            // Tidak perlu save() di sini, Laravel akan handle
            
            DB::commit();
            Log::info('=== LEAD OBSERVER: DELETING PROCESS COMPLETED ===');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ LeadObserver deleting failed: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * [TAMBAHAN BARU] Method untuk menghapus proposal terkait
     */
    private function deleteProposals(Lead $lead): void
    {
        try {
            $count = DB::table('proposals')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->update([
                    'deleted' => 1,
                    'deleted_by' => auth()->id() ?? $lead->deleted_by,
                    'deleted_at' => now()
                ]);

            if ($count > 0) {
                Log::info("✅ Soft deleted {$count} proposals connected to Lead {$lead->id}");
            }
        } catch (\Exception $e) {
            Log::warning("⚠️ Error deleting proposals: " . $e->getMessage());
            // Kita log warning saja agar tidak membatalkan proses utama jika proposal gagal dihapus
        }
    }

    /**
     * Delete payments melalui chain: Lead → Quotations → Invoices → Payments
     */
    private function deletePaymentsThroughQuotations(Lead $lead): void
    {
        Log::info("=== DELETING PAYMENTS THROUGH QUOTATIONS FOR LEAD {$lead->id} ===");
        
        try {
            // 1. Cari semua quotation IDs untuk lead ini
            $quotationIds = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            Log::info("Found " . count($quotationIds) . " quotations");
            
            if (empty($quotationIds)) {
                Log::info("No quotations found, skipping payments deletion");
                return;
            }
            
            // 2. Cari semua invoice IDs dari quotations tersebut
            $invoiceIds = DB::table('invoices')
                ->whereIn('quotation_id', $quotationIds)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            Log::info("Found " . count($invoiceIds) . " invoices from quotations");
            
            if (empty($invoiceIds)) {
                Log::info("No invoices found, skipping payments deletion");
                return;
            }
            
            // 3. Delete payments untuk invoices tersebut
            $deletedPayments = DB::table('payments')
                ->whereIn('invoice_id', $invoiceIds)
                ->where('deleted', 0)
                ->update([
                    'deleted' => 1,
                    'deleted_at' => now(),
                    'deleted_by' => null
                ]);
            
            Log::info("✅ Deleted {$deletedPayments} payments through quotations");
            
        } catch (\Exception $e) {
            Log::error("❌ Error deleting payments: " . $e->getMessage());
        }
    }

    /**
     * Delete invoices melalui chain: Lead → Quotations → Invoices
     */
    private function deleteInvoicesThroughQuotations(Lead $lead): void
    {
        Log::info("=== DELETING INVOICES THROUGH QUOTATIONS FOR LEAD {$lead->id} ===");
        
        try {
            // 1. Cari semua quotation IDs untuk lead ini
            $quotationIds = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            Log::info("Found " . count($quotationIds) . " quotations");
            
            if (empty($quotationIds)) {
                Log::info("No quotations found, skipping invoices deletion");
                return;
            }

            $invoiceIds = DB::table('invoices')
                ->whereIn('quotation_id', $quotationIds)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            if (!empty($invoiceIds)) {
                // [TAMBAHAN] Hapus Invoice Items berdasarkan Invoice IDs
                $deletedItems = DB::table('invoice_items')
                    ->whereIn('invoice_id', $invoiceIds)
                    ->where('deleted', 0)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);

                Log::info("✅ Deleted {$deletedItems} invoice items");

                // Hapus Invoices
                $deletedInvoices = DB::table('invoices')
                    ->whereIn('id', $invoiceIds)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Deleted {$deletedInvoices} invoices through quotations");
            }        
        } catch (\Exception $e) {
            Log::error("❌ Error deleting invoices: " . $e->getMessage());
        }
    }

    /**
     * Delete semua quotations untuk lead
     */
    private function deleteQuotations(Lead $lead): void
    {
        Log::info("=== DELETING QUOTATIONS FOR LEAD {$lead->id} ===");
        
        try {
            $quotationIds = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();

            if (!empty($quotationIds)) {
                // Hapus Items berdasarkan ID Quotation tadi
                $deletedItems = DB::table('quotation_items')
                    ->whereIn('quotation_id', $quotationIds)
                    ->where('deleted', 0)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Deleted {$deletedItems} quotation items");

                // Hapus Quotations
                $deletedQuotations = DB::table('quotations')
                    ->whereIn('id', $quotationIds)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Deleted {$deletedQuotations} quotations");
            }
            
            Log::info("✅ Deleted {$deletedQuotations} quotations");
            
        } catch (\Exception $e) {
            Log::error("❌ Error deleting quotations: " . $e->getMessage());
        }
    }

    /**
     * Delete ALL projects terkait lead dengan SEMUA cara yang mungkin
     */
    private function deleteProjectsThroughChain(Lead $lead): void
    {
        Log::info("=== COMPLETE PROJECTS DELETE FOR LEAD {$lead->id} ===");
        
        try {
            $totalDeleted = 0;
            
            Log::info("Lead company_id: " . ($lead->company_id ?: 'NULL'));
            Log::info("Lead name: {$lead->company_name}");
            
            // ===== CARA 1: Projects melalui company_id di lead =====
            if ($lead->company_id) {
                Log::info("Method 1: Checking projects with client_id = {$lead->company_id}");
                
                $projects1 = DB::table('projects')
                    ->where('client_id', $lead->company_id)
                    ->where('deleted', 0)
                    ->get();
                
                Log::info("Found " . $projects1->count() . " projects via client_id");
                
                foreach ($projects1 as $p) {
                    Log::info("  - Project: ID={$p->id}, Desc={$p->project_description}, Quotation=" . ($p->quotation_id ?: 'NULL'));
                }
                
                $deleted1 = DB::table('projects')
                    ->where('client_id', $lead->company_id)
                    ->where('deleted', 0)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                $totalDeleted += $deleted1;
                Log::info("✅ Deleted {$deleted1} projects via company_id");
            }
            
            // ===== CARA 2: Projects melalui company yang punya lead_id =====
            Log::info("Method 2: Checking companies with lead_id = {$lead->id}");
            
            $companies = DB::table('companies')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->get();
            
            Log::info("Found " . $companies->count() . " companies with this lead_id");
            
            foreach ($companies as $company) {
                Log::info("  Company: ID={$company->id}, Code={$company->client_code}");
                
                $projects2 = DB::table('projects')
                    ->where('client_id', $company->id)
                    ->where('deleted', 0)
                    ->get();
                
                Log::info("    Found " . $projects2->count() . " projects for this company");
                
                $deleted2 = DB::table('projects')
                    ->where('client_id', $company->id)
                    ->where('deleted', 0)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                $totalDeleted += $deleted2;
                Log::info("    ✅ Deleted {$deleted2} projects for company {$company->id}");
            }
            
            // ===== CARA 3: Projects melalui quotations =====
            Log::info("Method 3: Checking quotations for lead");
            
            $quotations = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->get();
            
            Log::info("Found " . $quotations->count() . " quotations for lead");
            
            foreach ($quotations as $quotation) {
                Log::info("  Quotation: ID={$quotation->id}, Number={$quotation->quotation_number}");
                
                $projects3 = DB::table('projects')
                    ->where('quotation_id', $quotation->id)
                    ->where('deleted', 0)
                    ->get();
                
                Log::info("    Found " . $projects3->count() . " projects for this quotation");
                
                $deleted3 = DB::table('projects')
                    ->where('quotation_id', $quotation->id)
                    ->where('deleted', 0)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                $totalDeleted += $deleted3;
                Log::info("    ✅ Deleted {$deleted3} projects for quotation {$quotation->id}");
            }
            
            // ===== CARA 4: Projects dengan nama company yang sama =====
            Log::info("Method 4: Checking projects by company name match: {$lead->company_name}");
            
            // Cari companies dengan nama yang mirip
            $similarCompanies = DB::table('companies')
                ->where('name', 'like', '%' . $lead->company_name . '%')
                ->orWhere('client_code', 'like', '%' . substr($lead->company_name, 0, 5) . '%')
                ->where('deleted', 0)
                ->get();
            
            Log::info("Found " . $similarCompanies->count() . " companies with similar name");
            
            foreach ($similarCompanies as $company) {
                $projects4 = DB::table('projects')
                    ->where('client_id', $company->id)
                    ->where('deleted', 0)
                    ->get();
                
                if ($projects4->count() > 0) {
                    Log::info("  Company {$company->id} ({$company->name}) has {$projects4->count()} projects");
                    
                    $deleted4 = DB::table('projects')
                        ->where('client_id', $company->id)
                        ->where('deleted', 0)
                        ->update([
                            'deleted' => 1,
                            'deleted_at' => now(),
                            'deleted_by' => null
                        ]);
                    
                    $totalDeleted += $deleted4;
                    Log::info("    ✅ Deleted {$deleted4} projects");
                }
            }
            
            Log::info("✅ TOTAL PROJECTS DELETED: {$totalDeleted}");
            
            // ===== VERIFICATION =====
            Log::info("=== VERIFICATION ===");
            
            // Hitung semua projects yang SEHARUSNYA terkait
            $shouldBeDeleted = 0;
            
            if ($lead->company_id) {
                $shouldBeDeleted += DB::table('projects')
                    ->where('client_id', $lead->company_id)
                    ->where('deleted', 0)
                    ->count();
            }
            
            foreach ($companies as $company) {
                $shouldBeDeleted += DB::table('projects')
                    ->where('client_id', $company->id)
                    ->where('deleted', 0)
                    ->count();
            }
            
            foreach ($quotations as $quotation) {
                $shouldBeDeleted += DB::table('projects')
                    ->where('quotation_id', $quotation->id)
                    ->where('deleted', 0)
                    ->count();
            }
            
            Log::info("Projects that SHOULD be deleted: {$shouldBeDeleted}");
            Log::info("Projects ACTUALLY deleted: {$totalDeleted}");
            
            if ($shouldBeDeleted > $totalDeleted) {
                Log::warning("⚠️ Some projects may not have been deleted!");
                
                // Tampilkan projects yang masih aktif
                $remainingProjects = DB::table('projects')
                    ->where('deleted', 0)
                    ->where(function($query) use ($lead, $companies, $quotations) {
                        if ($lead->company_id) {
                            $query->orWhere('client_id', $lead->company_id);
                        }
                        
                        foreach ($companies as $company) {
                            $query->orWhere('client_id', $company->id);
                        }
                        
                        foreach ($quotations as $quotation) {
                            $query->orWhere('quotation_id', $quotation->id);
                        }
                    })
                    ->get();
                
                foreach ($remainingProjects as $p) {
                    Log::warning("  Still active: Project ID={$p->id}, Desc={$p->project_description}, Client={$p->client_id}, Quotation=" . ($p->quotation_id ?: 'NULL'));
                }
            }
            
        } catch (\Exception $e) {
            Log::error("❌ Error in deleteProjectsThroughChain: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
        }
    }

    /**
     * Delete company terkait lead
     */
    private function deleteCompany(Lead $lead): void
    {
        Log::info("=== DELETING COMPANY FOR LEAD {$lead->id} ===");
        
        try {
            $company = null;
            
            // Cari via company_id di lead
            if ($lead->company_id) {
                $company = DB::table('companies')
                    ->where('id', $lead->company_id)
                    ->where('deleted', 0)
                    ->first();
                
                if ($company) {
                    Log::info("Found company via company_id: {$company->id}");
                }
            }
            
            // Cari via lead_id di company
            if (!$company) {
                $company = DB::table('companies')
                    ->where('lead_id', $lead->id)
                    ->where('deleted', 0)
                    ->first();
                
                if ($company) {
                    Log::info("Found company via lead_id: {$company->id}");
                }
            }
            
            if ($company) {
                // Delete company
                DB::table('companies')
                    ->where('id', $company->id)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Company {$company->id} deleted");
                
                // Delete company contacts
                $deletedContacts = DB::table('company_contact_persons')
                    ->where('company_id', $company->id)
                    ->where('deleted', 0)
                    ->update([
                        'deleted' => 1,
                        'deleted_at' => now(),
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Deleted {$deletedContacts} contacts for company {$company->id}");
            } else {
                Log::info("No company found for lead {$lead->id}");
            }
            
        } catch (\Exception $e) {
            Log::error("❌ Error deleting company: " . $e->getMessage());
        }
    }

    /**
     * Delete kontak yang langsung terkait dengan lead
     */
    private function deleteContacts(Lead $lead): void
    {
        Log::info("=== DELETING CONTACTS FOR LEAD {$lead->id} ===");
        
        try {
            $deletedContacts = DB::table('company_contact_persons')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->update([
                    'deleted' => 1,
                    'deleted_at' => now(),
                    'deleted_by' => null
                ]);
            
            Log::info("✅ Deleted {$deletedContacts} contacts directly linked to lead");
            
        } catch (\Exception $e) {
            Log::error("❌ Error deleting contacts: " . $e->getMessage());
        }
    }

    /**
     * Handle the Lead "restored" event.
     */
    public function restored(Lead $lead): void
    {
        try {
            Log::info("=== LEAD OBSERVER: RESTORING LEAD {$lead->id} ===");
            
            // Restore quotations
            $this->restoreQuotations($lead);
            
            // Restore invoices melalui quotations
            $this->restoreInvoicesThroughQuotations($lead);
            
            // Restore payments melalui invoices
            $this->restorePaymentsThroughQuotations($lead);
            
            // Restore projects melalui company atau quotations
            $this->restoreProjectsThroughChain($lead);
            
            // Restore company
            $this->restoreCompany($lead);
            
            // Restore contacts
            $this->restoreContacts($lead);
            
            Log::info("=== LEAD {$lead->id} RESTORED COMPLETELY ===");
            
        } catch (\Exception $e) {
            Log::error("LeadObserver restored failed: " . $e->getMessage());
        }
    }

    // ==================== RESTORE HELPER METHODS ====================

    private function restoreQuotations(Lead $lead): void
    {
        try {
            $restored = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 1)
                ->update([
                    'deleted' => 0,
                    'deleted_at' => null,
                    'deleted_by' => null
                ]);
            
            Log::info("✅ Restored {$restored} quotations");
        } catch (\Exception $e) {
            Log::warning("Error restoring quotations: " . $e->getMessage());
        }
    }

    private function restoreInvoicesThroughQuotations(Lead $lead): void
    {
        try {
            $quotationIds = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            if (!empty($quotationIds)) {
                $restored = DB::table('invoices')
                    ->whereIn('quotation_id', $quotationIds)
                    ->where('deleted', 1)
                    ->update([
                        'deleted' => 0,
                        'deleted_at' => null,
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Restored {$restored} invoices through quotations");
            }
        } catch (\Exception $e) {
            Log::warning("Error restoring invoices: " . $e->getMessage());
        }
    }

    private function restorePaymentsThroughQuotations(Lead $lead): void
    {
        try {
            $quotationIds = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            if (!empty($quotationIds)) {
                $invoiceIds = DB::table('invoices')
                    ->whereIn('quotation_id', $quotationIds)
                    ->where('deleted', 0)
                    ->pluck('id')
                    ->toArray();
                
                if (!empty($invoiceIds)) {
                    $restored = DB::table('payments')
                        ->whereIn('invoice_id', $invoiceIds)
                        ->where('deleted', 1)
                        ->update([
                            'deleted' => 0,
                            'deleted_at' => null,
                            'deleted_by' => null
                        ]);
                    
                    Log::info("✅ Restored {$restored} payments through quotations");
                }
            }
        } catch (\Exception $e) {
            Log::warning("Error restoring payments: " . $e->getMessage());
        }
    }

    private function restoreProjectsThroughChain(Lead $lead): void
    {
        try {
            $restored = 0;
            
            // Restore via company
            if ($lead->company_id) {
                $viaCompany = DB::table('projects')
                    ->where('client_id', $lead->company_id)
                    ->where('deleted', 1)
                    ->update([
                        'deleted' => 0,
                        'deleted_at' => null,
                        'deleted_by' => null
                    ]);
                
                $restored += $viaCompany;
            }
            
            // Restore via quotations
            $quotationIds = DB::table('quotations')
                ->where('lead_id', $lead->id)
                ->where('deleted', 0)
                ->pluck('id')
                ->toArray();
            
            if (!empty($quotationIds)) {
                $viaQuotations = DB::table('projects')
                    ->whereIn('quotation_id', $quotationIds)
                    ->where('deleted', 1)
                    ->update([
                        'deleted' => 0,
                        'deleted_at' => null,
                        'deleted_by' => null
                    ]);
                
                $restored += $viaQuotations;
            }
            
            Log::info("✅ Restored {$restored} projects through chain");
        } catch (\Exception $e) {
            Log::warning("Error restoring projects: " . $e->getMessage());
        }
    }

    private function restoreCompany(Lead $lead): void
    {
        try {
            $company = DB::table('companies')
                ->where('lead_id', $lead->id)
                ->orWhere('id', $lead->company_id)
                ->where('deleted', 1)
                ->first();
            
            if ($company) {
                DB::table('companies')
                    ->where('id', $company->id)
                    ->update([
                        'deleted' => 0,
                        'deleted_at' => null,
                        'deleted_by' => null
                    ]);
                
                Log::info("✅ Restored company {$company->id}");
                
                // Restore company contacts
                DB::table('company_contact_persons')
                    ->where('company_id', $company->id)
                    ->where('deleted', 1)
                    ->update([
                        'deleted' => 0,
                        'deleted_at' => null,
                        'deleted_by' => null
                    ]);
            }
        } catch (\Exception $e) {
            Log::warning("Error restoring company: " . $e->getMessage());
        }
    }

    private function restoreContacts(Lead $lead): void
    {
        try {
            $restored = DB::table('company_contact_persons')
                ->where('lead_id', $lead->id)
                ->where('deleted', 1)
                ->update([
                    'deleted' => 0,
                    'deleted_at' => null,
                    'deleted_by' => null
                ]);
            
            Log::info("✅ Restored {$restored} contacts");
        } catch (\Exception $e) {
            Log::warning("Error restoring contacts: " . $e->getMessage());
        }
    }
}