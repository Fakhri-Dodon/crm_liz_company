<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;
    
    // Tentukan nama tabel jika berbeda
    protected $table = 'payments';

    protected $fillable = [
        'id',
        'invoice_id',
        'amount',
        'method',
        'date',
        'note',
        'bank',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
        'deleted_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
        'deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // ============ GLOBAL SCOPE ============
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            
            if (empty($model->deleted)) {
                $model->deleted = 0;
            }
        });
    }
    
    /**
     * Global scope untuk data yang tidak dihapus
     */
    protected static function booted()
    {
        static::addGlobalScope('notDeleted', function ($query) {
            $query->where('deleted', 0);
        });
    }

    // ============ RELATIONSHIPS FIX ============
    
    /**
     * Get the invoice that owns the payment - TAMPILKAN SEMUA meski invoice dihapus
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }
    
    /**
     * Alias untuk invoice aktif saja (optional)
     */
    public function activeInvoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    /**
     * Get the user who created the payment.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the payment.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
    
    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
    
    // ============ ACCESSORS ============
    
    /**
     * Accessor untuk invoice info
     */
    public function getInvoiceInfoAttribute()
    {
        if ($this->invoice) {
            return [
                'invoice_number' => $this->invoice->invoice_number,
                'company_name' => $this->invoice->lead?->company_name ?? $this->invoice->company?->name,
                'total' => $this->invoice->total
            ];
        }
        
        return null;
    }
    
    /**
     * Accessor untuk formatted amount
     */
    public function getFormattedAmountAttribute()
    {
        return 'Rp ' . number_format($this->amount, 0, ',', '.');
    }
    
    /**
     * Accessor untuk formatted date
     */
    public function getFormattedDateAttribute()
    {
        return $this->date ? $this->date->format('d M Y') : '';
    }

    // ============ SCOPES ============
    
    public function scopeWithTrashed($query)
    {
        return $query->withoutGlobalScope('notDeleted');
    }
    
    public function scopeOnlyTrashed($query)
    {
        return $query->withoutGlobalScope('notDeleted')->where('deleted', 1);
    }
    
    /**
     * Scope a query to only include payments with specific method.
     */
    public function scopeByMethod($query, $method)
    {
        return $query->where('deleted', 0)->where('method', $method);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->where('deleted', 0)->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by month and year.
     */
    public function scopeByMonthYear($query, $month, $year)
    {
        return $query->where('deleted', 0)
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year);
    }
    
    /**
     * Scope a query to filter by invoice
     */
    public function scopeByInvoice($query, $invoiceId)
    {
        return $query->where('deleted', 0)->where('invoice_id', $invoiceId);
    }
    
    /**
     * Scope a query to filter by lead (via invoice)
     */
    public function scopeByLead($query, $leadId)
    {
        return $query->where('deleted', 0)
                    ->whereHas('invoice', function($q) use ($leadId) {
                        $q->where('lead_id', $leadId);
                    });
    }
    
    /**
     * Scope a query to filter by company (via invoice)
     */
    public function scopeByCompany($query, $companyId)
    {
        return $query->where('deleted', 0)
                    ->whereHas('invoice', function($q) use ($companyId) {
                        $q->where('company_id', $companyId);
                    });
    }
    
    /**
     * Scope a query to search payments
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('deleted', 0)->where(function($q) use ($search) {
            $q->where('note', 'like', "%{$search}%")
              ->orWhere('bank', 'like', "%{$search}%")
              ->orWhereHas('invoice', function($q2) use ($search) {
                  $q2->where('invoice_number', 'like', "%{$search}%");
              });
        });
    }
}