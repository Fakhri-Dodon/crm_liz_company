<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AppConfig extends Model
{
    use SoftDeletes;

    // Menentukan primary key menggunakan UUID (bukan integer)
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'company_name',
        'address',
        'lead_user_base_visibility',
        'lead_default_filter_by_login',
        'proposal_user_base_visibility',
        'proposal_default_filter_by_login',
        'default_language',
        'allow_language_change',
        'logo_path',
        'doc_logo_path',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted'
    ];

    protected $casts = [
        'allow_language_change' => 'boolean',
        'lead_user_base_visibility' => 'boolean',
        'lead_default_filter_by_login' => 'boolean',
        'proposal_user_base_visibility' => 'boolean',
        'proposal_default_filter_by_login' => 'boolean',
    ];

    protected $appends = [
        'logo_url',
        'doc_logo_url'
    ];

    /**
     * Boot function untuk menangani logika otomatis (UUID & Audit Trail)
     */
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

    /**
     * Accessor: Mengubah path logo menjadi URL yang bisa diakses browser
     */
    public function getLogoUrlAttribute()
    {
        if (!$this->logo_path) {
            return null;
        }
        // Pastikan Anda sudah menjalankan 'php artisan storage:link'
        return Storage::url($this->logo_path);
    }

    /**
     * Accessor: Mengubah path dokumen logo menjadi URL
     */
    public function getDocLogoUrlAttribute()
    {
        if (!$this->doc_logo_path) {
            return null;
        }
        return Storage::url($this->doc_logo_path);
    }

    public function scopeActive($query)
    {
        return $query->where('deleted', false);
    }
}