<?php

namespace App\Models;

use App\Models\Companies;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class CompanyContactPerson extends Model
{
    use SoftDeletes;

    protected $table = 'company_contact_persons'; 
    
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 
        'company_id', 
        'lead_id', 
        'name', 
        'position', 
        'is_primary', 
        'is_active', 
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted'
    ];

    // Boot untuk generate UUID otomatis
    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Auth::uuid();
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

    public function company()
    {
        return $this->belongsTo(Companies::class, 'company_id', 'id');
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }
}