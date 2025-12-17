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
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::uuid();
        });
    }
}
