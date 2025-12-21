<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientType extends Model
{
    use HasFactory;

    protected $table = 'client_type';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'id',
        'name',
        'information',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at',
        'deleted'
    ];

    /**
     * Global scope untuk data aktif
     */
    protected static function booted()
    {
        static::addGlobalScope('active', function ($query) {
            $query->where('deleted', 0)
                  ->whereNull('deleted_at');
        });
    }
    
    // Relationships
    public function companies()
    {
        return $this->hasMany(Company::class, 'client_type_id');
    }
}