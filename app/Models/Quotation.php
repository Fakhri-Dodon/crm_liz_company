<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Lead;

class Quotation extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'lead_id',
        'quotation_number',
        'status',
        'subject',
        'payment_terms',
        'note',
        'date',
        'valid_until',  
        'revision_note',
        'pdf_path',
        'sub_total',
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
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'accepted_at' => 'datetime',
        'deleted' => 'boolean',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    // Relationships
    public function project()
    {
        return $this->hasOne(Project::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'id');
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
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function acceptor()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}