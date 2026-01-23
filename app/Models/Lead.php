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
        'id',
        'lead_statuses_id',
        'company_name',
        'address',
        'contact_person',
        'email',
        'phone',
        'position',
        'assigned_to',
        'converted_to_company',
        'converted_at',
        'company_id',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted',
        'deleted_at'
    ];

    protected $casts = [
        'converted_to_company' => 'boolean',
        'converted_at' => 'datetime',
        'deleted' => 'boolean',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Append status_name for easier access
    protected $appends = ['status_name'];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            // Generate UUID if not provided
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            
            // Set default deleted flag
            if (!isset($model->deleted)) {
                $model->deleted = 0;
            }
            
            // Set created_by if auth exists
            if (auth()->check() && empty($model->created_by)) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            // Set updated_by if auth exists
            if (auth()->check() && empty($model->updated_by)) {
                $model->updated_by = auth()->id();
            }
        });
    }

    // ============ RELATIONSHIPS ============

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'lead_id');
    }
    
    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'lead_id');
    }

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

    public function contacts()
    {
        return $this->hasMany(CompanyContactPerson::class, 'lead_id', 'id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

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

    // ============ ACCESSORS ============
    
    public function getStatusNameAttribute()
    {
        return $this->status ? $this->status->name : 'New';
    }

    public function getStatusColorAttribute()
    {
        return $this->status ? $this->status->color : '#3b82f6';
    }
    
    public function getIsDeletedAttribute()
    {
        return $this->deleted == 1 || $this->deleted_at !== null;
    }
    
    public function getCompanyNameWithStatusAttribute()
    {
        $name = $this->company_name ?? '';
        
        if ($this->deleted == 1) {
            return $name . ' [Deleted]';
        }
        
        if ($this->converted_to_company) {
            return $name . ' ✓';
        }
        
        return $name;
    }

    // ============ SCOPES ============
    
    public function scopeConverted($query)
    {
        return $query->where('converted_to_company', true);
    }
    
    public function scopeNotConverted($query)
    {
        return $query->where('converted_to_company', false);
    }

    public function scopeWithStatus($query, $statusName)
    {
        return $query->whereHas('status', function($q) use ($statusName) {
            $q->where('name', $statusName);
        });
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeCreatedBy($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    public function scopeApplyAccessControl($query, $user)
    {
        // If no user, return query as is
        if (!$user) {
            return $query;
        }

        // Try to get config
        try {
            $config = \DB::table('app_configs')->where('deleted', 0)->first();
        } catch (\Exception $e) {
            // If config table doesn't exist, return query
            return $query;
        }

        $roleName = $user->role?->name;
        
        // Admin and Manager can see all leads
        if (in_array($roleName, ['Admin', 'Manager'])) {
            return $query;
        }

        // Apply user-based visibility if configured
        if ($config && $config->lead_user_base_visibility == 1) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id);
            });
        }

        // Apply default filter by login user if configured
        if ($config && $config->lead_default_filter_by_login == 1 && !request()->has('search')) {
            $query->where('assigned_to', $user->id);
        }

        return $query;
    }
    
    // ============ GLOBAL SCOPE ============
    
    /**
     * Global scope untuk filter data yang tidak dihapus
     * SIMPLE VERSION - selalu apply where('deleted', 0)
     */
    protected static function booted()
    {
        static::addGlobalScope('notDeleted', function ($query) {
            $query->where('deleted', 0);
        });
    }
    
    // ============ HELPER METHODS ============
    
    /**
     * Query dengan semua data (termasuk deleted)
     */
    public static function withTrashed()
    {
        return (new static)->newQuery()->withoutGlobalScope('notDeleted');
    }
    
    /**
     * Query hanya data yang dihapus
     */
    public static function onlyTrashed()
    {
        return (new static)->newQuery()->withoutGlobalScope('notDeleted')->where('deleted', 1);
    }
    
    /**
     * Restore dari trash
     */
    public function restoreFromTrash()
    {
        $this->deleted = 0;
        $this->deleted_at = null;
        $this->deleted_by = null;
        return $this->save();
    }
    
    /**
     * Soft delete dengan custom logic
     */
    public function softDeleteWithReason($userId = null)
    {
        $this->deleted = 1;
        $this->deleted_at = now();
        
        if ($userId) {
            $this->deleted_by = $userId;
        } elseif (auth()->check()) {
            $this->deleted_by = auth()->id();
        }
        
        return $this->save();
    }
    
    /**
     * Get related data summary
     */
    public function getRelatedDataSummary()
    {
        return [
            'quotations_count' => $this->quotations()->count(),
            'invoices_count' => class_exists(Invoice::class) ? 
                Invoice::where('lead_id', $this->id)->count() : 0,
            'contacts_count' => $this->contacts()->count(),
            'has_company' => $this->company_id || $this->leadCompany ? true : false,
            'has_converted' => $this->converted_to_company,
            'projects_count' => class_exists(Project::class) ?
                Project::where('lead_id', $this->id)
                    ->orWhere('client_id', $this->company_id)
                    ->count() : 0
        ];
    }
    
    /**
     * Check if lead can be deleted (no important related data)
     */
    public function canDelete()
    {
        $summary = $this->getRelatedDataSummary();
        
        // Check if lead has quotations, invoices, or projects
        if ($summary['quotations_count'] > 0 || 
            $summary['invoices_count'] > 0 || 
            $summary['projects_count'] > 0) {
            return false;
        }
        
        return true;
    }
}