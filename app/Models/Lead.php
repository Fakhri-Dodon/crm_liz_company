<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Lead extends Model
{
    use SoftDeletes;

    protected $table = 'leads';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'company_name',
        'address',
        'contact_person',
        'email',
        'phone',
        'status',
        'assigned_to',
        'converted_to_company', // Tambahkan jika migration dijalankan
        'converted_at', // Tambahkan jika migration dijalankan
        'company_id', // Tambahkan jika migration dijalankan
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'converted_to_company' => 'boolean',
        'converted_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::uuid();
        });
    }

    // Relationships
    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'lead_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
    
    public function leadCompany()
    {
        return $this->hasOne(Company::class, 'lead_id');
    }
    
    // Scope untuk leads yang sudah di-convert
    public function scopeConverted($query)
    {
        if (Schema::hasColumn('leads', 'converted_to_company')) {
            return $query->where('converted_to_company', true);
        }
        return $query->where('status', 'sent'); // Fallback
    }
    
    // Scope untuk leads yang belum di-convert
    public function scopeNotConverted($query)
    {
        if (Schema::hasColumn('leads', 'converted_to_company')) {
            return $query->where('converted_to_company', false);
        }
        return $query->where('status', '!=', 'sent')->orWhereNull('status'); // Fallback
    }
}