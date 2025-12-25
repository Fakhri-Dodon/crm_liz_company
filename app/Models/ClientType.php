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

    protected $casts = [
        'deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * COMMENT DULU GLOBAL SCOPE UNTUK DEBUG
     * Global scope untuk data aktif
     */
    /*
    protected static function booted()
    {
        static::addGlobalScope('active', function ($query) {
            $query->where('deleted', 0)
                  ->whereNull('deleted_at');
        });
    }
    */

    /**
     * Boot method untuk UUID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (auth()->check()) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });
    }
    
    // Relationships
    public function companies()
    {
        return $this->hasMany(Company::class, 'client_type_id', 'id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('deleted', 0)->whereNull('deleted_at');
    }

    public function scopeWithTrashed($query)
    {
        return $query; // Karena nonaktifkan global scope
    }

    public function scopeOnlyTrashed($query)
    {
        return $query->where('deleted', 1)->whereNotNull('deleted_at');
    }
}