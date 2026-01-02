<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $appends = ['is_online', 'last_seen_formatted'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'phone',
        'position',
        'last_seen',
        'role_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function getLastSeenFormattedAttribute()
    {
        if (!$this->last_seen) {
            return '-';
        }

        // diffForHumans() akan menghasilkan "10 days ago", "2 hours ago", dll.
        return $this->last_seen->diffForHumans();
    }

    public function getIsOnlineAttribute()
    {
        // Jika aktivitas terakhir < 5 menit yang lalu
        return $this->last_seen && $this->last_seen->diffInMinutes(now()) < 5;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function role()
    {
        return $this->belongsTo(Roles::class);
    }

    public function getPermissions($menuName)
    {
        return \DB::table('menu_mapping')
            ->join('menu', 'menu_mapping.menu_id', '=', 'menu.id')
            ->where('menu_mapping.role_id', $this->role_id)
            ->where('menu.name', $menuName)
            ->select(
                'menu_mapping.can_read',
                'menu_mapping.can_create',
                'menu_mapping.can_update',
                'menu_mapping.can_delete'
            )
            ->first() ?? (object)[ // Default jika tidak ditemukan mapping
                'can_read' => 0,
                'can_create' => 0,
                'can_update' => 0,
                'can_delete' => 0
            ];
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_seen' => 'datetime'
        ];
    }

    // **TAMBAHKAN INI: HAPUS booted() method yang membuat UUID**
    // User.id adalah BIGINT (auto-increment), jadi biarkan Laravel handle
}