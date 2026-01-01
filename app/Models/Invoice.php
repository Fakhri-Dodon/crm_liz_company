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
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id', 'id');
    }

    public function contactPerson()
    {
        return $this->belongsTo(CompanyContactPerson::class, 'company_contact_persons_id', 'id');
    }
}
