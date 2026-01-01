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

        // Filter by keyword (search in invoice number or company name)
        if ($request->has('keyword') && $request->keyword) {
            $keyword = $request->keyword;
            $query->where(function($q) use ($keyword) {
                $q->whereHas('invoice', function($invoiceQuery) use ($keyword) {
                    $invoiceQuery->where('invoice_number', 'like', "%{$keyword}%")
                        ->orWhereHas('quotation.company', function($companyQuery) use ($keyword) {
                            $companyQuery->where('name', 'like', "%{$keyword}%");
                        })
                        ->orWhereHas('contactPerson.company', function($companyQuery) use ($keyword) {
                            $companyQuery->where('name', 'like', "%{$keyword}%");
                        });
                });
            });
        }

        // Filter by method
        if ($request->has('method') && $request->method) {
            $query->where('method', strtolower($request->method));
        }

        // Filter by month and year
        if ($request->has('month') && $request->has('year')) {
            $monthNumber = array_search($request->month, [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]) + 1;
            
            if ($monthNumber) {
                $query->whereMonth('date', $monthNumber)
                    ->whereYear('date', $request->year);
            }
        }

        $payments = $query->orderBy('date', 'desc')->get()->map(function ($payment) {
            $company = $payment->invoice->quotation->company ?? $payment->invoice->contactPerson->company ?? null;
            $companyName = 'N/A';
            
            if ($company && $company->lead) {
                $companyName = $company->lead->company_name ?? 'N/A';
            }
            
            return [
                'id' => $payment->id,
                'invoice_number' => $payment->invoice->invoice_number ?? 'N/A',
                'payment_date' => $payment->date->format('d-m-Y'),
                'company_name' => $companyName,
                'company_id' => $company->id ?? null,
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
            'filters' => $request->only(['keyword', 'method', 'month', 'year'])
        ]);
    }

    /**
     * Get invoices for payment creation
     */
    public function getInvoices()
    {
        $invoices = Invoice::with(['quotation.company.lead', 'contactPerson.company.lead'])
            ->whereIn('status', ['Draft', 'Invoice', 'Unpaid', 'Partial']) // Allow Draft for testing
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($invoice) {
                $paidAmount = Payment::where('invoice_id', $invoice->id)
                    ->where('deleted', 0)
                    ->sum('amount');
                
                // Get company from quotation or contact person
                $company = null;
                $companyName = 'No Company';
                
                if ($invoice->quotation && $invoice->quotation->company) {
                    $company = $invoice->quotation->company;
                    // Get company name from lead
                    $companyName = $company->lead->company_name ?? 'Company';
                } elseif ($invoice->contactPerson && $invoice->contactPerson->company) {
                    $company = $invoice->contactPerson->company;
                    // Get company name from lead
                    $companyName = $company->lead->company_name ?? 'Company';
                }
                    
                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'company_name' => $companyName,
                    'company_id' => $company ? $company->id : null,
                    'total_amount' => (float) $invoice->total,
                    'paid_amount' => (float) $paidAmount,
                    'remaining_amount' => (float) ($invoice->total - $paidAmount),
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

            // Update invoice payment status if needed
            $invoice = Invoice::find($validated['invoice_id']);
            $totalPaid = Payment::where('invoice_id', $invoice->id)->sum('amount');
            
            if ($totalPaid >= $invoice->total) {
                $invoice->update(['payment_status' => 'paid']);
            } elseif ($totalPaid > 0) {
                $invoice->update(['payment_status' => 'partial']);
            }

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

            // Update payment status for old invoice
            if ($oldInvoiceId != $validated['invoice_id']) {
                $oldInvoice = Invoice::find($oldInvoiceId);
                $oldTotalPaid = Payment::where('invoice_id', $oldInvoiceId)->sum('amount');
                
                if ($oldTotalPaid >= $oldInvoice->total) {
                    $oldInvoice->update(['payment_status' => 'paid']);
                } elseif ($oldTotalPaid > 0) {
                    $oldInvoice->update(['payment_status' => 'partial']);
                } else {
                    $oldInvoice->update(['payment_status' => 'unpaid']);
                }
            }

            // Update payment status for new invoice
            $newInvoice = Invoice::find($validated['invoice_id']);
            $newTotalPaid = Payment::where('invoice_id', $validated['invoice_id'])->sum('amount');
            
            if ($newTotalPaid >= $newInvoice->total) {
                $newInvoice->update(['payment_status' => 'paid']);
            } elseif ($newTotalPaid > 0) {
                $newInvoice->update(['payment_status' => 'partial']);
            } else {
                $newInvoice->update(['payment_status' => 'unpaid']);
            }

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

            // Update invoice payment status
            $invoice = Invoice::find($invoiceId);
            $totalPaid = Payment::where('invoice_id', $invoiceId)
                ->where('deleted', 0)
                ->sum('amount');
            
            if ($totalPaid >= $invoice->total) {
                $invoice->update(['payment_status' => 'paid']);
            } elseif ($totalPaid > 0) {
                $invoice->update(['payment_status' => 'partial']);
            } else {
                $invoice->update(['payment_status' => 'unpaid']);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Payment successfully deleted');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to delete payment: ' . $e->getMessage());
        }
    }
}
