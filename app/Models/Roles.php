<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Roles extends Model
{
    protected $table = 'roles';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 
        'name',
        'description',
        'created_by',  
        'updated_by',  
        'deleted'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}