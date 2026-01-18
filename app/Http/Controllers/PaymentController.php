<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Payment::with(['invoice.quotation.company.lead', 'invoice.contactPerson.company.lead'])
            ->where('deleted', 0);

        // Debug filters
        \Log::debug('Payment filters', $request->only('keyword', 'method', 'month', 'year'));

        // Keyword search (invoice number, lead/quotation company name, contact person fields)
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function($q) use ($keyword) {
                $q->whereHas('invoice', function($iq) use ($keyword) {
                    $iq->where('invoice_number', 'like', "%{$keyword}%")
                       ->orWhere('id', $keyword);
                })
                ->orWhereHas('invoice.quotation.lead', function($lq) use ($keyword) {
                    $lq->where('company_name', 'like', "%{$keyword}%")
                       ->orWhere('contact_person', 'like', "%{$keyword}%")
                       ->orWhere('email', 'like', "%{$keyword}%");
                })
                ->orWhereHas('invoice.contactPerson', function($cpq) use ($keyword) {
                    $cpq->where('name', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%")
                        ->orWhere('phone', 'like', "%{$keyword}%");
                });
            });
        }

        // Method filtering - accept labels or internal values
        if ($request->filled('method')) {
            $method = strtolower($request->method);
            $map = [
                'transfer' => 'transfer',
                'bank transfer' => 'transfer',
                'transferencia' => 'transfer',
                'cash' => 'cash',
                'tunai' => 'cash',
                'check' => 'check',
                'cheque' => 'check'
            ];

            $methodKey = $map[$method] ?? $method;

            if ($methodKey !== 'all' && in_array($methodKey, ['transfer', 'cash', 'check'])) {
                $query->where('method', $methodKey);
            }
        }

        // Month filter (accept numeric month '1'..'12' or month name)
        if ($request->filled('month')) {
            $month = $request->month;
            if (is_numeric($month)) {
                $query->whereMonth('date', (int)$month);
            } else {
                $monthNumber = array_search(ucfirst(strtolower($month)), [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ]) + 1;
                if ($monthNumber) {
                    $query->whereMonth('date', $monthNumber);
                }
            }
        }

        // Year filter
        if ($request->filled('year')) {
            $query->whereYear('date', $request->year);
        }

        $payments = $query->orderBy('date', 'desc')->get()->map(function ($payment) {
            $company = $payment->invoice->quotation->company ?? $payment->invoice->contactPerson->company ?? null;
            $companyName = 'N/A';
            $companyId = $company->id ?? null;

            if ($company && $company->lead) {
                $companyName = $company->lead->company_name ?? 'N/A';
            } elseif ($payment->invoice->contactPerson && $payment->invoice->contactPerson->lead) {
                // Fallback: jika tidak ada company, ambil dari lead pada contactPerson
                $companyName = $payment->invoice->contactPerson->lead->company_name ?? 'N/A';
                $companyId = null;
            }

            return [
                'id' => $payment->id,
                'invoice_id' => $payment->invoice_id,
                'invoice_number' => $payment->invoice->invoice_number ?? 'N/A',
                'payment_date' => $payment->date->format('d/m/Y'),
                'company_name' => $companyName,
                'company_id' => $companyId,
                'amount' => (float) $payment->amount,
                'methode' => ucfirst($payment->method),
                'bank' => $payment->bank,
                'note' => $payment->note,
            ];
        });

        // Calculate statistics
        $allPayments = Payment::where('deleted', 0)->get();
        
        $stats = [
            'total_payment' => [
                'count' => $allPayments->count(),
                'amount' => (float) $allPayments->sum('amount')
            ],
            'transfer' => [
                'count' => $allPayments->where('method', 'transfer')->count(),
                'amount' => (float) $allPayments->where('method', 'transfer')->sum('amount')
            ],
            'cash' => [
                'count' => $allPayments->where('method', 'cash')->count(),
                'amount' => (float) $allPayments->where('method', 'cash')->sum('amount')
            ],
            'check' => [
                'count' => $allPayments->where('method', 'check')->count(),
                'amount' => (float) $allPayments->where('method', 'check')->sum('amount')
            ]
        ];

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'stats' => $stats,
            'filters' => $request->only(['keyword', 'method', 'month', 'year']),
            'auth_permissions' => auth()->user()->getPermissions('PAYMENT'),
        ]);
    }

    /**
     * Get invoices for payment creation
     */
    public function getInvoices()
    {
        // Return only invoices with amount_due > 0 (still unpaid or partially paid)
        $invoices = Invoice::with(['quotation.company.lead', 'contactPerson.company.lead', 'contactPerson.lead'])
            ->where('deleted', 0)
            ->where('amount_due', '>', 0)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($invoice) {
                $paidAmount = Payment::where('invoice_id', $invoice->id)
                    ->where('deleted', 0)
                    ->sum('amount');

                $company = null;
                $companyName = 'No Company';

                // Samakan logika dengan InvoiceController
                if ($invoice->contactPerson) {
                    if ($invoice->contactPerson->company_id && $invoice->contactPerson->company) {
                        $company = $invoice->contactPerson->company;
                        $companyName = optional($company->lead)->company_name ?? 'N/A';
                    } elseif ($invoice->contactPerson->lead_id && $invoice->contactPerson->lead) {
                        $companyName = $invoice->contactPerson->lead->company_name ?? 'N/A';
                    }
                } elseif ($invoice->quotation && $invoice->quotation->company) {
                    $company = $invoice->quotation->company;
                    $companyName = optional($company->lead)->company_name ?? 'N/A';
                }

                // Compute remaining using authoritative amount_due if present, fallback to calculation
                $remaining = (float) ($invoice->amount_due ?? ($invoice->total - $paidAmount));

                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'company_name' => $companyName,
                    'company_id' => $company ? $company->id : null,
                    'total_amount' => (float) $invoice->total,
                    'paid_amount' => (float) $paidAmount,
                    'remaining_amount' => $remaining,
                    'status' => $invoice->status,
                ];
            })
            ->filter(function ($invoice) {
                // Only show invoices that still have remaining amount
                return $invoice['remaining_amount'] > 0;
            })
            ->values();

        return response()->json($invoices);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'method' => 'required|in:transfer,cash,check',
            'date' => 'required|date',
            'bank' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $payment = Payment::create([
                'invoice_id' => $validated['invoice_id'],
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'date' => $validated['date'],
                'bank' => $validated['bank'] ?? null,
                'note' => $validated['note'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Update invoice payment info after payment
            $invoice = Invoice::find($validated['invoice_id']);
            $totalPaid = Payment::where('invoice_id', $invoice->id)->where('deleted', 0)->sum('amount');
            $amountDue = max(0, $invoice->total - $totalPaid);
            $status = 'Unpaid';
            if ($totalPaid >= $invoice->total) {
                $status = 'Paid';
            } elseif ($totalPaid > 0) {
                $status = 'Partial';
            }
            $invoiceData = [
                'amount_due' => $amountDue,
                'status' => $status
            ];
            $statusObj = \App\Models\InvoiceStatuses::where('name', $status)->first();
            if ($statusObj) {
                $invoiceData['invoice_statuses_id'] = $statusObj->id;
            }
            $invoice->update($invoiceData);

            DB::commit();

            return redirect()->back()->with('success', 'Payment successfully created');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create payment: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'method' => 'required|in:transfer,cash,check',
            'date' => 'required|date',
            'bank' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $oldInvoiceId = $payment->invoice_id;
            
            $payment->update([
                'invoice_id' => $validated['invoice_id'],
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'date' => $validated['date'],
                'bank' => $validated['bank'] ?? null,
                'note' => $validated['note'] ?? null,
                'updated_by' => Auth::id(),
            ]);

            // Update payment info for old invoice if invoice changed
            if ($oldInvoiceId != $validated['invoice_id']) {
                $oldInvoice = Invoice::find($oldInvoiceId);
                $oldTotalPaid = Payment::where('invoice_id', $oldInvoiceId)->where('deleted', 0)->sum('amount');
                $oldAmountDue = max(0, $oldInvoice->total - $oldTotalPaid);
                $oldStatus = 'Unpaid';
                if ($oldTotalPaid >= $oldInvoice->total) {
                    $oldStatus = 'Paid';
                } elseif ($oldTotalPaid > 0) {
                    $oldStatus = 'Partial';
                }
                $oldInvoiceData = [
                    'amount_due' => $oldAmountDue,
                    'status' => $oldStatus
                ];
                $oldStatusObj = \App\Models\InvoiceStatuses::where('name', $oldStatus)->first();
                if ($oldStatusObj) {
                    $oldInvoiceData['invoice_statuses_id'] = $oldStatusObj->id;
                }
                $oldInvoice->update($oldInvoiceData);
            }

            // Update payment info for new invoice
            $newInvoice = Invoice::find($validated['invoice_id']);
            $newTotalPaid = Payment::where('invoice_id', $validated['invoice_id'])->where('deleted', 0)->sum('amount');
            $newAmountDue = max(0, $newInvoice->total - $newTotalPaid);
            $newStatus = 'Unpaid';
            if ($newTotalPaid >= $newInvoice->total) {
                $newStatus = 'Paid';
            } elseif ($newTotalPaid > 0) {
                $newStatus = 'Partial';
            }
            $newInvoiceData = [
                'amount_due' => $newAmountDue,
                'status' => $newStatus
            ];
            $newStatusObj = \App\Models\InvoiceStatuses::where('name', $newStatus)->first();
            if ($newStatusObj) {
                $newInvoiceData['invoice_statuses_id'] = $newStatusObj->id;
            }
            $newInvoice->update($newInvoiceData);

            DB::commit();

            return redirect()->back()->with('success', 'Payment successfully updated');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update payment: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        try {
            DB::beginTransaction();

            $invoiceId = $payment->invoice_id;
            
            // Soft delete
            $payment->update([
                'deleted' => 1,
                'deleted_by' => Auth::id(),
            ]);
            $payment->delete();

            // Update invoice payment info after payment deleted
            $invoice = Invoice::find($invoiceId);
            $totalPaid = Payment::where('invoice_id', $invoiceId)
                ->where('deleted', 0)
                ->sum('amount');
            $amountDue = max(0, $invoice->total - $totalPaid);
            $status = 'Unpaid';
            if ($totalPaid >= $invoice->total) {
                $status = 'Paid';
            } elseif ($totalPaid > 0) {
                $status = 'Partial';
            }
            $invoiceData = [
                'amount_due' => $amountDue,
                'status' => $status
            ];
            $statusObj = \App\Models\InvoiceStatuses::where('name', $status)->first();
            if ($statusObj) {
                $invoiceData['invoice_statuses_id'] = $statusObj->id;
            }
            $invoice->update($invoiceData);

            DB::commit();

            return redirect()->back()->with('success', 'Payment successfully deleted');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to delete payment: ' . $e->getMessage());
        }
    }
}
