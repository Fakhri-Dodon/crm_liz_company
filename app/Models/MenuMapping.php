<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class MenuMapping extends Model
{
    protected $table = 'menu_mapping';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 
        'role_id', 
        'menu_id', 
        'can_create', 
        'can_read', 
        'can_update', 
        'can_delete',
        'created_by',  
        'updated_by',  
        'deleted'
    ];

    protected static function boot()
    {
        parent::boot();

        // Saat data akan dibuat (creating)
        static::creating(function ($model) {
            // Isi ID dengan UUID jika kosong
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
            
            // Isi created_by dengan ID user yang sedang login
            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
        });

        // Saat data akan diupdate (updating)
        static::updating(function ($model) {
            // Isi updated_by dengan ID user yang sedang login
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        // Saat data akan dihapus (deleting)
        static::deleting(function ($model) {
            // Isi deleted_by dan set flag deleted
            if (Auth::check()) {
                $model->deleted_by = Auth::id();
                $model->deleted = true;
                $model->save();
            }
        });
    }   
}