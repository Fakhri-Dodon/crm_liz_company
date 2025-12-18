<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menu';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 
        'name',
        'route',
        'updated_by',
        'deleted'
    ];
}