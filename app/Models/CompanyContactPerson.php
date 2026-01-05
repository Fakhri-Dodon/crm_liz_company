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

    // HAPUS $appends ini karena menyebabkan conflict
    // protected $appends = ['name', 'email', 'phone'];

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
            return false;
        });
    }

    // Relationships
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'id');
    }

    // Accessors - TIDAK PERLU karena akan menyebabkan infinite loop
    // public function getNameAttribute()
    // {
    //     // Jika ada lead, ambil nama dari lead
    //     if ($this->lead) {
    //         return $this->lead->contact_person;
    //     }
        
    //     return $this->attributes['name'] ?? null;
    // }

    // public function getEmailAttribute()
    // {
    //     if ($this->lead) {
    //         return $this->lead->email;
    //     }
        
    //     return $this->attributes['email'] ?? null;
    // }

    // public function getPhoneAttribute()
    // {
    //     if ($this->lead) {
    //         return $this->lead->phone;
    //     }
        
    //     return $this->attributes['phone'] ?? null;
    // }
}