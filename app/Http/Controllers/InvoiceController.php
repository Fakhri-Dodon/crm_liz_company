<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\CompanyContactPerson;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::with(['contactPerson', 'items'])->orderBy('created_at', 'desc')->get();
        $data = $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'number' => $inv->invoice_number,
                'date' => optional($inv->date)->format('Y-m-d') ?? $inv->date,
                'company' => optional($inv->contactPerson)->company_name ?? optional($inv->contactPerson)->name ?? 'N/A',
                'company_id' => $inv->company_contact_persons_id,
                'amount' => (int) $inv->invoice_amout,
                'paid_amount' => (int) ($inv->total - $inv->amount_due),
                'tax' => [
                    'ppn' => (int) $inv->ppn,
                    'pph' => (int) $inv->pph,
                ],
                'due_amount' => (int) $inv->amount_due,
                'status' => $inv->status,
            ];
        });

        // Ambil semua contact person (bisa dioptimasi pagination jika data besar)
        $contacts = CompanyContactPerson::orderBy('id')->get();

        return Inertia::render('Invoices/Index', [
            'invoices' => $data,
            'contacts' => $contacts,
        ]);
    }

    public function create()
    {
        return Inertia::render('Invoices/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quotation_id' => 'nullable|string',
            'company_contact_persons_id' => 'required|string',
            'invoice_number' => 'required|string',
            'date' => 'required|date',
            'invoice_amout' => 'required|numeric',
            'payment_terms' => 'nullable|string',
            'payment_type' => 'nullable|string',
            'payment_percentage' => 'nullable|numeric',
            'note' => 'nullable|string',
            'ppn' => 'nullable|numeric',
            'pph' => 'nullable|numeric',
            'total' => 'nullable|numeric',
            'amount_due' => 'nullable|numeric',
            'status' => 'nullable|in:Draft,Paid,Invoice,Unpaid,Cancelled',
            'items' => 'nullable|array',
            'items.*.services' => 'required_with:items|string',
            'items.*.amount' => 'required_with:items|numeric',
        ]);

        $invoice = Invoice::create([
            'quotation_id' => $validated['quotation_id'] ?? null,
            'company_contact_persons_id' => $validated['company_contact_persons_id'],
            'invoice_number' => $validated['invoice_number'],
            'date' => $validated['date'],
            'invoice_amout' => $validated['invoice_amout'],
            'payment_terms' => $validated['payment_terms'] ?? '',
            'payment_type' => $validated['payment_type'] ?? '',
            'payment_percentage' => $validated['payment_percentage'] ?? 0,
            'note' => $validated['note'] ?? '',
            'ppn' => $validated['ppn'] ?? 0,
            'pph' => $validated['pph'] ?? 0,
            'total' => $validated['total'] ?? $validated['invoice_amout'],
            'amount_due' => $validated['amount_due'] ?? ($validated['invoice_amout'] - ($validated['ppn'] ?? 0) - ($validated['pph'] ?? 0)),
            'status' => $validated['status'] ?? 'Draft',
        ]);

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $it) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'services' => $it['services'],
                    'amount' => $it['amount'],
                ]);
            }
        }

        return redirect()->route('invoice.index')->with('success', 'Invoice created');
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['contactPerson', 'items']);
        return Inertia::render('Invoices/Show', ['invoice' => $invoice]);
    }

    public function edit(Invoice $invoice)
    {
        $invoice->load(['contactPerson', 'items']);
        return Inertia::render('Invoices/Edit', ['invoice' => $invoice]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'date' => 'required|date',
            'invoice_amout' => 'required|numeric',
            'ppn' => 'nullable|numeric',
            'pph' => 'nullable|numeric',
            'amount_due' => 'nullable|numeric',
            'status' => 'nullable|in:Draft,Paid,Invoice,Unpaid,Cancelled',
            'items' => 'nullable|array',
        ]);

        $invoice->update([
            'invoice_number' => $validated['invoice_number'],
            'date' => $validated['date'],
            'invoice_amout' => $validated['invoice_amout'],
            'ppn' => $validated['ppn'] ?? $invoice->ppn,
            'pph' => $validated['pph'] ?? $invoice->pph,
            'amount_due' => $validated['amount_due'] ?? $invoice->amount_due,
            'status' => $validated['status'] ?? $invoice->status,
            'payment_terms' => $validated['payment_terms'] ?? $invoice->payment_terms ?? '',
            'payment_type' => $validated['payment_type'] ?? $invoice->payment_type ?? '',
            'payment_percentage' => $validated['payment_percentage'] ?? $invoice->payment_percentage ?? 0,
            'note' => $validated['note'] ?? $invoice->note ?? '',
        ]);

        // Replace items if provided
        if (isset($validated['items'])) {
            $invoice->items()->delete();
            foreach ($validated['items'] as $it) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'services' => $it['services'],
                    'amount' => $it['amount'],
                ]);
            }
        }

        return redirect()->route('invoice.index')->with('success', 'Invoice updated');
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return redirect()->route('invoice.index')->with('success', 'Invoice deleted');
    }
}
