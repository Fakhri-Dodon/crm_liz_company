<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Auth;

class ProposalStatuses extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'note',
        'color',
        'color_name',
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
    public function updater() 
    { 
        return $this->belongsTo(User::class, 'updated_by'); 
    }
    public function deleter() 
    { 
        return $this->belongsTo(User::class, 'deleted_by'); 
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        static::deleting(function ($model) {
            if (Auth::check()) {
                $model->deleted_by = Auth::id();
                $model->deleted = true;
                $model->save();
                return false; 
            }
        });
    }
}
