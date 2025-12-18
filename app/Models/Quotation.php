<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'subtotal',
        'discount',
        'tax',
        'total',
        'accepted_at',
        'accepted_by', // PERUBAHAN: integer (BIGINT) sesuai database
        'created_by', // PERUBAHAN: integer (BIGINT)
        'updated_by', // PERUBAHAN: integer (BIGINT)
        'deleted_by', // PERUBAHAN: integer (BIGINT)
        'deleted'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'accepted_at' => 'datetime',
        'deleted' => 'boolean',
        // **TAMBAHKAN casting untuk user-related fields**
        'accepted_by' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer',
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
        return $this->belongsTo(Lead::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // **TAMBAHKAN relationship untuk accepted_by dan deleted_by**
    public function acceptor()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}