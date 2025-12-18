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
    
    // HAPUS SoftDeletes karena kita pakai kolom 'deleted'
    // JANGAN gunakan: use SoftDeletes;
    
    /**
     * Global scope untuk data aktif
     * Gunakan kondisi: deleted = 0 DAN deleted_at IS NULL
     */
    protected static function boot()
    {
        parent::boot();
        
        static::addGlobalScope('active', function ($query) {
            // Logika AND: harus memenuhi kedua kondisi
            $query->where('deleted', 0)
                  ->whereNull('deleted_at');
            
            // ATAU jika ingin OR (salah satu kondisi terpenuhi)
            // $query->where(function($q) {
            //     $q->where('deleted', 0)
            //       ->orWhereNull('deleted_at');
            // });
        });
    }
    
    // Relationships
    public function projects()
    {
        return $this->hasMany(Project::class, 'client_id');
    }
}