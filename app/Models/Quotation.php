<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Carbon\Carbon;

class Quotation extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'quotations';

    protected $fillable = [
        'id',
        'lead_id',
        'company_contact_person_id',
        'quotation_number_formated_id',
        'quotation_statuses_id',
        'quotation_number',
        'status',
        'subject',
        'payment_terms',
        'note',
        'date',
        'valid_until',
        'revision_note',
        'pdf_path',
        'subtotal',
        'discount',
        'tax',
        'total',
        'accepted_at',
        'accepted_by',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted'
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'valid_until' => 'date:Y-m-d',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'accepted_at' => 'datetime',
        'deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected function status(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (in_array($value, ['accepted', 'rejected'])) {
                    return $value;
                }

                if ($this->valid_until && Carbon::now()->startOfDay()->gt($this->valid_until)) {
                    return 'expired';
                }

                return $value;
            },
        );
    }

    public function statusRel()
    {
        return $this->belongsTo(QuotationStatuses::class, 'quotation_statuses_id');
    }

    public function scopeSyncExpiredStatus($query)
    {
        return $query->where('deleted', 0)
            ->whereNotIn('status', ['accepted', 'rejected', 'expired'])
            ->where('valid_until', '<', now()->startOfDay())
            ->update(['status' => 'expired']);
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    // ============ RELATIONSHIPS FIX ============
    
    public function project()
    {
        return $this->hasOne(Project::class);
    }

    public function companyContactPerson()
    {
        return $this->belongsTo(CompanyContactPerson::class, 'company_contact_person_id');
    }
    
    /**
     * Relasi ke company (jika ada) - TAMPILKAN SEMUA meski company dihapus
     */
    public function company()
    {
        return $this->hasOne(Company::class, 'quotation_id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }
    
    /**
     * Relasi ke lead - TAMPILKAN SEMUA meski lead dihapus
     */
    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }
    
    /**
     * Alias untuk lead aktif saja (jika perlu)
     */
    public function activeLead()
    {
        return $this->belongsTo(Lead::class, 'lead_id'); // Dengan global scope
    }
    
    public function items()
    {
        return $this->hasMany(QuotationItem::class, 'quotation_id', 'id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }

    public function acceptor()
    {
        return $this->belongsTo(User::class, 'accepted_by', 'id');
    }

    public function acceptedBy()
    {
        return $this->belongsTo(User::class, 'accepted_by', 'id');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by', 'id');
    }
    
    // ============ SCOPES ============
    
    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }
    
    public function scopeNotConverted($query)
    {
        return $query->whereDoesntHave('company');
    }
    
    // ============ GLOBAL SCOPE ============
    
    /**
     * Global scope untuk data yang tidak dihapus
     */
    protected static function booted()
    {
        static::addGlobalScope('notDeleted', function ($query) {
            $query->where('deleted', 0);
        });
    }
}