<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory;

    protected $table = 'projects';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
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

        static::retrieved(function ($model) {
            \Log::debug('Project model retrieved:', [
                'id' => $model->id,
                'client_id' => $model->client_id,
                'company_id' => $model->company_id,
                'description' => $model->project_description
            ]);
        });
    }

    // ============ ACCESSORS ============
    
    // Accessor untuk company_id alias
    public function getCompanyIdAttribute()
    {
        return $this->client_id;
    }

    // Mutator untuk company_id alias
    public function setCompanyIdAttribute($value)
    {
        $this->attributes['client_id'] = $value;
    }

    // ============ RELATIONSHIPS FIX ============
    
    // Relationship dengan Company - TAMPILKAN SEMUA meski company dihapus
    public function company()
    {
        return $this->belongsTo(Company::class, 'client_id', 'id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
    }

    // Relationship dengan Quotation - TAMPILKAN SEMUA meski quotation dihapus
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id')
                    ->withoutGlobalScope('notDeleted'); // Hapus scope deleted
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
    
    // ============ GLOBAL SCOPE ============
    
    /**
     * Global scope untuk data yang tidak dihapus
     */
    protected static function booted()
    {
        static::addGlobalScope('notDeleted', function ($query) {
            $query->where('deleted', 0);
        });
    }
    
    // ============ SCOPES ============

    // Di app/Models/Project.php - tambahkan method ini

    /**
     * Scope untuk mencari projects berdasarkan lead_id (melalui company)
     */
    public function scopeByLead($query, $leadId)
    {
        // Cari company_id dari lead
        $lead = \App\Models\Lead::find($leadId);
        
        if ($lead && $lead->company_id) {
            return $query->where('client_id', $lead->company_id);
        }
        
        return $query->where('id', null); // Return empty result
    }

    /**
     * Scope untuk mencari projects berdasarkan quotation dari lead
     */
    public function scopeByLeadQuotations($query, $leadId)
    {
        // Cari quotation_ids dari lead
        $quotationIds = \App\Models\Quotation::where('lead_id', $leadId)
            ->pluck('id')
            ->toArray();
        
        if (!empty($quotationIds)) {
            return $query->whereIn('quotation_id', $quotationIds);
        }
        
        return $query->where('id', null); // Return empty result
    }

    /**
     * Get all projects related to a lead (via company OR quotations)
     */
    public static function getProjectsByLead($leadId)
    {
        $projects = collect();
        
        // Via company
        $lead = \App\Models\Lead::find($leadId);
        if ($lead && $lead->company_id) {
            $projects = $projects->merge(
                self::where('client_id', $lead->company_id)->get()
            );
        }
        
        // Via quotations
        $quotationIds = \App\Models\Quotation::where('lead_id', $leadId)
            ->pluck('id')
            ->toArray();
        
        if (!empty($quotationIds)) {
            $projects = $projects->merge(
                self::whereIn('quotation_id', $quotationIds)->get()
            );
        }
        
        return $projects->unique('id');
    }
    
    public function scopeWithTrashed($query)
    {
        return $query->withoutGlobalScope('notDeleted');
    }
    
    public function scopeOnlyTrashed($query)
    {
        return $query->withoutGlobalScope('notDeleted')->where('deleted', 1);
    }
    
    public function scopeActive($query)
    {
        return $query->where('deleted', 0)->where('status', 'active');
    }
    
    public function scopeCompleted($query)
    {
        return $query->where('deleted', 0)->where('status', 'completed');
    }
    
    public function scopeInProgress($query)
    {
        return $query->where('deleted', 0)->where('status', 'in_progress');
    }
}