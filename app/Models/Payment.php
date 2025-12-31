<?php
// app/Models/Payment.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $table = 'payments';
    protected $primaryKey = 'id';
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
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * Relasi ke invoice
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    /**
     * Relasi ke user yang membuat
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi ke user yang mengupdate
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope untuk exclude deleted records
     */
    public function scopeActive($query)
    {
        return $query->where('deleted', 0);
    }

    /**
     * Get method label
     */
    public function getMethodLabelAttribute()
    {
        $methods = [
            'transfer' => 'Bank Transfer',
            'cash' => 'Cash',
            'check' => 'Check'
        ];

        return $methods[$this->method] ?? $this->method;
    }

    /**
     * Get method color class
     */
    public function getMethodColorAttribute()
    {
        $colors = [
            'transfer' => 'bg-blue-100 text-blue-800',
            'cash' => 'bg-green-100 text-green-800',
            'check' => 'bg-purple-100 text-purple-800'
        ];

        return $colors[$this->method] ?? 'bg-gray-100 text-gray-800';
    }
}