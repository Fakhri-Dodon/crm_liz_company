<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $table = 'projects';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    // Tetap pakai client_id untuk database
    protected $fillable = [
        'id',
        'quotation_id',
        'client_id',  // Database pakai client_id
        'user_id',
        'project_description',
        'start_date',
        'deadline',
        'status',
        'note',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
        'deleted_at'
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
        'deleted' => 'boolean',
        'deleted_at' => 'datetime',
        'client_id' => 'string',
        'user_id' => 'string',
        'created_by' => 'string',
        'updated_by' => 'string',
        'deleted_by' => 'string',
    ];

    // TAMBAHKAN: Appends untuk alias company_id
    protected $appends = ['company_id'];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            
            if (empty($model->deleted)) {
                $model->deleted = 0;
            }
            
            if (empty($model->status)) {
                $model->status = 'in_progress';
            }
        });
    }

    // TAMBAHKAN: Accessor untuk company_id alias
    public function getCompanyIdAttribute()
    {
        return $this->client_id;
    }

    // TAMBAHKAN: Mutator untuk company_id alias
    public function setCompanyIdAttribute($value)
    {
        $this->attributes['client_id'] = $value;
    }

    // Relationship dengan Company - pakai client_id
    public function company()
    {
        return $this->belongsTo(Company::class, 'client_id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by', 'id');
    }

    // Alias untuk backward compatibility
    public function client()
    {
        return $this->company();
    }
}