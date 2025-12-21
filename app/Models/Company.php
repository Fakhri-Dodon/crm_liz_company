<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $table = 'companies';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'client_type_id',
        'lead_id',
        'quotation_id',
        'client_code',
        'name',
        'address',
        'contact_person',
        'position',
        'email',
        'phone',
        'client_since',
        'postal_code',
        'vat_number',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
        'deleted'
    ];

    protected $casts = [
        'client_since' => 'date',
        'postal_code' => 'integer',
        'vat_number' => 'integer',
        'is_active' => 'boolean',
        'deleted' => 'boolean'
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::orderedUuid();
            }
            if (empty($model->client_code)) {
                $model->client_code = 'CL-' . strtoupper(uniqid());
            }
            // Set created_by from authenticated user
            if (auth()->check()) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            // Set updated_by from authenticated user
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });
    }

    /**
     * Global scope untuk data aktif
     */
    protected static function booted()
    {
        static::addGlobalScope('active', function ($query) {
            $query->where('deleted', 0)
                  ->whereNull('deleted_at');
        });
    }

    // Relationships
    public function clientType()
    {
        return $this->belongsTo(ClientType::class, 'client_type_id');
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
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

    // Accessors
    public function getTypeAttribute()
    {
        return $this->clientType ? $this->clientType->name : null;
    }

    public function getStatusAttribute()
    {
        return $this->is_active ? 'Active' : 'Inactive';
    }

    public function getClientSinceFormattedAttribute()
    {
        return $this->client_since ? $this->client_since->format('d M Y') : 'N/A';
    }

    public function getVatNumberFormattedAttribute()
    {
        return $this->vat_number ? number_format($this->vat_number, 0, ',', '.') : 'N/A';
    }
}