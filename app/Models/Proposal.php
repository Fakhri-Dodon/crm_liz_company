<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proposal extends Model
{
    use SoftDeletes;

    protected $table = 'proposals';

    protected $fillable = [
        'title',
        'content',
        'lead_id',
        'status',
        'sent_at',
        'opened_at',
        // ... kolom lain sesuai kebutuhan
    ];

    // Status constants
    const STATUS_DRAFT = 'DRAFT';
    const STATUS_SENT = 'SENT';
    const STATUS_OPENED = 'OPENED';

    // Relasi ke Lead
    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}
