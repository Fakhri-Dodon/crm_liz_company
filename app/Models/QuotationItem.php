<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuotationItem extends Model
{
    protected $table = 'quotation_items';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'quotation_id',
        'processing',
        'amount',
        'name',
        'qty',
        'price',
        'total'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id');
    }
}