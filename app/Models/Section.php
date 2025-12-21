<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = [
        'section_name',
        'title',
        'content',
        'image_path',
        'type',
        'order',
    ];
}
