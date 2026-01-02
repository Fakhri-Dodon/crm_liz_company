<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'invoice_id',
        'amount',
        'method',
        'date',
        'note',
        'bank',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
        'deleted' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the invoice that owns the payment.
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    /**
     * Get the user who created the payment.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the payment.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope a query to only include payments with specific method.
     */
    public function scopeByMethod($query, $method)
    {
        return $query->where('method', $method);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by month and year.
     */
    public function scopeByMonthYear($query, $month, $year)
    {
        return $query->whereMonth('date', $month)
                    ->whereYear('date', $year);
    }
}
