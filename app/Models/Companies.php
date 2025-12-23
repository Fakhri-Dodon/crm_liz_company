<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Companies extends Model
{
    use HasFactory, SoftDeletes;

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
        'client_since',
        'postal_code',
        'vat_number',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'client_since' => 'date',
        'postal_code' => 'integer',
        'vat_number' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // --- RELASI ---

    /**
     * Relasi ke Lead (Jika perusahaan ini berasal dari Lead tertentu)
     */
    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'id');
    }

    /**
     * Relasi ke Quotation (Quotation yang membuat Lead ini jadi Company)
     */
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    public function contactPersons()
    {
        return $this->hasMany(CompanyContactPerson::class, 'company_id', 'id');
    }
}