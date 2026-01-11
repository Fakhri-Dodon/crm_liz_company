<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class Pph extends Model
{
    use HasFactory;

    protected $table = 'pph';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'rate',
        'description',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
    ];

    /**
     * Boot function untuk otomatis mengisi UUID saat create data baru.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }

            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
            $model->deleted = 0;
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        static::deleting(function ($model) {
            if (Auth::check()) {
                $model->deleted_by = Auth::id();
            }
            $model->deleted = 1;
            $model->save();
        });
    }

    /**
     * Scope untuk mengambil data yang belum dihapus (deleted = 0)
     */
    public function scopeActive($query)
    {
        return $query->where('deleted', 0);
    }
}