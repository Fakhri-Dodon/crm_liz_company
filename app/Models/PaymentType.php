<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class PaymentType extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'note',
        'order',
        'is_system',
        'deleted',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->slug) && !empty($model->name)) {
                $model->slug = Str::slug($model->name, '_');
            }
            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
            $model->deleted = 0;
        });

        static::updating(function ($model) {
            if (empty($model->slug) && !empty($model->name)) {
                $model->slug = Str::slug($model->name, '_');
            }
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
            return false; // prevent hard delete
        });
    }

    public function scopeActive($query)
    {
        return $query->where('deleted', 0);
    }
}
