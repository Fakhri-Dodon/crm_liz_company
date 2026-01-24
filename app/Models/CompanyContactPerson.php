<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompanyContactPerson extends Model
{
    use SoftDeletes;

    protected $table = 'company_contact_persons';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'company_id',
        'lead_id',
        'name',
        'email',
        'phone',
        'position',
        'is_primary',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
        'deleted_at'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
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
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (auth()->check()) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        static::deleting(function ($model) {
            $model->deleted = true;
            $model->deleted_at = now();
            if (auth()->check()) {
                $model->deleted_by = auth()->id();
            }
            return false; // Mencegah hard delete
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
     * Relationship dengan Company - TAMPILKAN SEMUA meski company dihapus
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    /**
     * Relationship dengan Lead - TAMPILKAN SEMUA meski lead dihapus
     */
    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }
    
    /**
     * Alias untuk company aktif saja (optional)
     */
    public function activeCompany()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }
    
    /**
     * Alias untuk lead aktif saja (optional)
     */
    public function activeLead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'id');
    }
    
    // ============ ACCESSORS ============
    
    /**
     * Accessor untuk nama lengkap (jika perlu)
     */
    public function getFullNameAttribute()
    {
        if (!empty($this->attributes['name'])) {
            return $this->attributes['name'];
        }
        
        // Fallback ke lead contact person jika ada
        if ($this->lead && !empty($this->lead->contact_person)) {
            return $this->lead->contact_person;
        }
        
        return null;
    }
    
    /**
     * Accessor untuk email (with fallback)
     */
    public function getEmailWithFallbackAttribute()
    {
        if (!empty($this->attributes['email'])) {
            return $this->attributes['email'];
        }
        
        // Fallback ke lead email jika ada
        if ($this->lead && !empty($this->lead->email)) {
            return $this->lead->email;
        }
        
        return null;
    }
    
    /**
     * Accessor untuk phone (with fallback)
     */
    public function getPhoneWithFallbackAttribute()
    {
        if (!empty($this->attributes['phone'])) {
            return $this->attributes['phone'];
        }
        
        // Fallback ke lead phone jika ada
        if ($this->lead && !empty($this->lead->phone)) {
            return $this->lead->phone;
        }
        
        return null;
    }
    
    /**
     * Accessor untuk company name (jika perlu)
     */
    public function getCompanyNameAttribute()
    {
        if ($this->company) {
            return $this->company->name;
        }
        
        if ($this->lead) {
            return $this->lead->company_name;
        }
        
        return null;
    }
    
    /**
     * Accessor untuk lead status
     */
    public function getLeadStatusAttribute()
    {
        return $this->lead ? $this->lead->status_name : null;
    }

    // ============ SCOPES ============
    
    public function scopeActive($query)
    {
        return $query->where('deleted', 0)->where('is_active', 1);
    }
    
    public function scopePrimary($query)
    {
        return $query->where('deleted', 0)->where('is_primary', 1);
    }
    
    public function scopeByCompany($query, $companyId)
    {
        return $query->where('deleted', 0)->where('company_id', $companyId);
    }
    
    public function scopeByLead($query, $leadId)
    {
        return $query->where('deleted', 0)->where('lead_id', $leadId);
    }
    
    public function scopeSearch($query, $search)
    {
        return $query->where('deleted', 0)
            ->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
    }
    
    public function scopeWithTrashed($query)
    {
        return $query->withoutGlobalScope('notDeleted');
    }
    
    public function scopeOnlyTrashed($query)
    {
        return $query->withoutGlobalScope('notDeleted')->where('deleted', 1);
    }
    
    // ============ BUSINESS LOGIC METHODS ============
    
    /**
     * Cek apakah contact person ini terkait dengan lead yang sudah dihapus
     */
    public function isFromDeletedLead()
    {
        return $this->lead && $this->lead->deleted == 1;
    }
    
    /**
     * Cek apakah contact person ini terkait dengan company yang sudah dihapus
     */
    public function isFromDeletedCompany()
    {
        return $this->company && $this->company->deleted == 1;
    }
    
    /**
     * Get preferred contact information
     */
    public function getPreferredContact()
    {
        return [
            'name' => $this->name ?: ($this->lead ? $this->lead->contact_person : null),
            'email' => $this->email ?: ($this->lead ? $this->lead->email : null),
            'phone' => $this->phone ?: ($this->lead ? $this->lead->phone : null),
            'position' => $this->position ?: ($this->lead ? $this->lead->position : null)
        ];
    }
    
    /**
     * Mark as primary contact
     */
    public function markAsPrimary()
    {
        // Unset other primary contacts for the same company
        if ($this->company_id) {
            self::where('company_id', $this->company_id)
                ->where('id', '!=', $this->id)
                ->update(['is_primary' => false]);
        }
        
        $this->is_primary = true;
        return $this->save();
    }
    
    /**
     * Duplicate contact for another company/lead
     */
    public function duplicate($newCompanyId = null, $newLeadId = null)
    {
        $newContact = $this->replicate();
        $newContact->id = (string) \Illuminate\Support\Str::uuid();
        
        if ($newCompanyId) {
            $newContact->company_id = $newCompanyId;
        }
        
        if ($newLeadId) {
            $newContact->lead_id = $newLeadId;
        }
        
        $newContact->is_primary = false; // New contact shouldn't be primary by default
        $newContact->save();
        
        return $newContact;
    }
}