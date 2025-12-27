<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Company extends Model
{
    use SoftDeletes;

    protected $table = 'companies';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
 // SESUAIKAN dengan kolom yang ADA di database
    protected $fillable = [
        'id',
        'client_type_id',
        'lead_id',
        'quotation_id',
        'client_code', 
        'client_since',
        'city',
        'province',
        'country',
        'postal_code',
        'vat_number',
        'nib',
        'website',
        'logo_path',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
        'deleted_at'
    ];

    protected $casts = [
        'client_since' => 'date',
        'postal_code' => 'integer',
        'vat_number' => 'integer',
        'is_active' => 'boolean',
        'deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($model->client_code)) {
                $model->client_code = 'CL-' . strtoupper(uniqid());
            }
            if (auth()->check()) {
                $model->created_by = auth()->id();
            }
            // Default is_active ke true sesuai database
            if (!isset($model->is_active)) {
                $model->is_active = true;
            }
            // Default deleted ke false
            if (!isset($model->deleted)) {
                $model->deleted = false;
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        static::deleting(function ($model) {
            // Soft delete
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

    // Accessors
    public function getLogoUrlAttribute()
    {
        if (!$this->logo_path) return null;
        
        if (filter_var($this->logo_path, FILTER_VALIDATE_URL)) {
            return $this->logo_path;
        }
        
        return Storage::url($this->logo_path);
    }

    public function getStatusAttribute()
    {
        return $this->is_active ? 'Active' : 'Inactive';
    }

    public function getClientTypeNameAttribute()
    {
        return $this->clientType ? $this->clientType->name : null;
    }

    public function getClientSinceFormattedAttribute()
    {
        return $this->client_since ? $this->client_since->format('d M Y') : 'N/A';
    }

    public function getVatNumberFormattedAttribute()
    {
        return $this->vat_number ? number_format($this->vat_number, 0, ',', '.') : 'N/A';
    }

    // Relationships
    public function clientType()
    {
        return $this->belongsTo(ClientType::class, 'client_type_id', 'id');
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    public function contacts()
    {
        return $this->hasMany(CompanyContactPerson::class, 'company_id', 'id');
    }

    public function primaryContact()
    {
        return $this->hasOne(CompanyContactPerson::class, 'company_id', 'id')
                    ->where('is_primary', true)
                    ->where('is_active', true)
                    ->where('deleted', 0);
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

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeByType($query, $typeId)
    {
        return $query->where('client_type_id', $typeId);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('client_code', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%")
              ->orWhere('contact_person', 'like', "%{$search}%");
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
}