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
    
    // **PERBAIKAN: Fillable harus match dengan database**
    protected $fillable = [
        'id',
        'quotation_id',
        'client_id',
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
        // **PERBAIKAN: Semua char(36) tetap string**
        'user_id' => 'string',
        'created_by' => 'string',
        'updated_by' => 'string',
        'deleted_by' => 'string',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            
            // Set defaults
            if (empty($model->deleted)) {
                $model->deleted = 0;
            }
            
            if (empty($model->status)) {
                $model->status = 'in_progress';
            }
        });
    }

    // Relationships
    public function client()
    {
        return $this->belongsTo(ClientType::class, 'client_id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id');
    }

    // **PERBAIKAN: Relationship dengan user (UUID)**
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'user_id', 'id'); // asumsi id user adalah UUID
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
}