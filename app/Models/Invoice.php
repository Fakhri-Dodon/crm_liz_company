<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoices';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'lead_id',
        'company_id',
        'quotation_id',
        'company_contact_persons_id',
        'invoice_number_formated_id',
        'invoice_statuses_id',
        'invoice_number',
        'date',
        'invoice_amout',
        'payment_terms',
        'payment_type',
        'payment_percentage',
        'note',
        'ppn',
        'pph',
        'sub_total',
        'total',
        'amount_due',
        'status',
        'pdf_path',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
        'deleted_at'
    ];

    protected $casts = [
        'date' => 'date',
        'invoice_amout' => 'decimal:2',
        'sub_total' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'payment_percentage' => 'decimal:2',
        'ppn' => 'decimal:2',
        'pph' => 'decimal:2',
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
    
    public function items()
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    /**
     * Relationship dengan Quotation - TAMPILKAN SEMUA meski quotation dihapus
     */
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    /**
     * Relationship dengan Contact Person - TAMPILKAN SEMUA meski contact dihapus
     */
    public function contactPerson()
    {
        return $this->belongsTo(CompanyContactPerson::class, 'company_contact_persons_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    /**
     * Relationship dengan Company - TAMPILKAN SEMUA meski company dihapus
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    /**
     * Relationship dengan Lead MELALUI quotation
     * Karena tidak ada direct lead_id, kita akses via quotation
     */
    public function lead()
    {
        return $this->hasOneThrough(
            Lead::class, // Target model
            Quotation::class, // Intermediate model
            'id', // Foreign key on quotations table
            'id', // Foreign key on leads table  
            'quotation_id', // Local key on invoices table
            'lead_id' // Local key on quotations table
        )->withoutGlobalScope('notDeleted');
    }
    
    /**
     * Accessor untuk mendapatkan lead_id via quotation
     */
    public function getLeadIdAttribute()
    {
        return $this->quotation ? $this->quotation->lead_id : null;
    }
    
    /**
     * Accessor untuk lead info (via quotation)
     */
    public function getLeadInfoAttribute()
    {
        if ($this->quotation && $this->quotation->lead) {
            return [
                'company_name' => $this->quotation->lead->company_name,
                'contact_person' => $this->quotation->lead->contact_person,
                'email' => $this->quotation->lead->email,
                'phone' => $this->quotation->lead->phone
            ];
        }
        
        return null;
    }
    
    /**
     * Scope untuk filter by lead_id (via quotation)
     */
    public function scopeByLead($query, $leadId)
    {
        return $query->where('deleted', 0)
            ->whereHas('quotation', function($q) use ($leadId) {
                $q->where('lead_id', $leadId);
            });
    }

    public function invoiceStatus()
    {
        return $this->belongsTo(\App\Models\InvoiceStatuses::class, 'invoice_statuses_id');
    }

    /**
     * Relationship dengan Payments - TAMPILKAN SEMUA meski payment dihapus
     */
    public function payments()
    {
        return $this->hasMany(Payment::class, 'invoice_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    // Alias untuk payments aktif saja (optional)
    public function activePayments()
    {
        return $this->hasMany(Payment::class, 'invoice_id', 'id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }
    
    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by', 'id');
    }

    // ============ ACCESSORS ============
    
    /**
     * Accessor untuk amount paid
     */
    public function getAmountPaidAttribute()
    {
        return $this->payments()
            ->where('deleted', 0)
            ->sum('amount') ?? 0;
    }
    
    /**
     * Accessor untuk outstanding amount
     */
    public function getOutstandingAmountAttribute()
    {
        $total = $this->total ?? 0;
        $paid = $this->amount_paid;
        return max(0, $total - $paid);
    }
    
    /**
     * Accessor untuk payment percentage
     */
    public function getPaymentPercentageAttribute()
    {
        $total = $this->total ?? 0;
        if ($total <= 0) return 0;
        
        $paid = $this->amount_paid;
        return min(100, round(($paid / $total) * 100, 2));
    }
    
    /**
     * Accessor untuk status dengan outstanding
     */
    public function getDetailedStatusAttribute()
    {
        if ($this->deleted == 1) {
            return 'deleted';
        }
        
        $outstanding = $this->outstanding_amount;
        
        if ($outstanding <= 0) {
            return 'paid';
        } elseif ($outstanding < $this->total) {
            return 'partially_paid';
        } else {
            return $this->status ?? 'unpaid';
        }
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
    
    public function scopeUnpaid($query)
    {
        return $query->where('deleted', 0)->where(function($q) {
            $q->where('status', 'unpaid')
              ->orWhereRaw('total > COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id AND deleted = 0), 0)');
        });
    }
    
    public function scopePaid($query)
    {
        return $query->where('deleted', 0)
            ->whereRaw('total <= COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id AND deleted = 0), 0)');
    }
    
    public function scopeOverdue($query)
    {
        return $query->where('deleted', 0)
            ->where('date', '<', now()->subDays(30))
            ->whereRaw('total > COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id AND deleted = 0), 0)');
    }
    
    public function scopeByCompany($query, $companyId)
    {
        return $query->where('deleted', 0)->where('company_id', $companyId);
    }
    
    public function scopeByQuotation($query, $quotationId)
    {
        return $query->where('deleted', 0)->where('quotation_id', $quotationId);
    }
    
    public function scopeSearch($query, $search)
    {
        return $query->where('deleted', 0)->where(function($q) use ($search) {
            $q->where('invoice_number', 'like', "%{$search}%")
              ->orWhereHas('lead', function($q2) use ($search) {
                  $q2->where('company_name', 'like', "%{$search}%");
              })
              ->orWhereHas('company', function($q2) use ($search) {
                  $q2->where('name', 'like', "%{$search}%");
              });
        });
    }
}