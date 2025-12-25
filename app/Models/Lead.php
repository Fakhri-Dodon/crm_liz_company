<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class Lead extends Model
{
    use SoftDeletes;

    protected $table = 'leads';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'lead_statuses_id',
        'company_name',
        'address',
        'contact_person',
        'email',
        'phone',
        'assigned_to',
        'converted_to_company',
        'converted_at',
        'company_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'converted_to_company' => 'boolean',
        'converted_at' => 'datetime',
    ];

    // Append status_name for easier access
    protected $appends = ['status_name'];

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::uuid();
        });
    }

    // Relationships
    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'lead_id');
    }

    // FIXED: Use belongsTo for foreign key relationship
    public function status()
    {
        return $this->belongsTo(LeadStatuses::class, 'lead_statuses_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
    
    public function leadCompany()
    {
        return $this->hasOne(Company::class, 'lead_id');
    }

    // Accessor for status name
    public function getStatusNameAttribute()
    {
        return $this->status ? $this->status->name : null;
    }

    // Optional: Accessor for status color
    public function getStatusColorAttribute()
    {
        return $this->status ? $this->status->color : null;
    }
    
    // FIXED scopes - remove references to non-existent 'status' column
    public function scopeConverted($query)
    {
        if (Schema::hasColumn('leads', 'converted_to_company')) {
            return $query->where('converted_to_company', true);
        }
        // Alternative fallback if needed
        return $query->whereHas('status', function($q) {
            $q->where('name', 'converted'); // Assuming you have a status named 'converted'
        });
    }
    
    public function scopeNotConverted($query)
    {
        if (Schema::hasColumn('leads', 'converted_to_company')) {
            return $query->where('converted_to_company', false);
        }
        // Alternative fallback if needed
        return $query->whereHas('status', function($q) {
            $q->where('name', '!=', 'converted');
        })->orDoesntHave('status');
    }

    // Optional: Scope for specific status
    public function scopeWithStatus($query, $statusName)
    {
        return $query->whereHas('status', function($q) use ($statusName) {
            $q->where('name', $statusName);
        });
    }
}