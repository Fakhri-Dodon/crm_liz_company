<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class QuotationNumberFormated extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'quotation_number_formated';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'prefix',
        'prefix_description',
        'padding',
        'padding_description',
        'next_number',
        'next_number_description',
        'created_by',
        'updated_by',
        'deleted_by', 
        'created_at',
        'updated_at',
        'deleted_at',
        'deleted'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    /**
     * Helper Function: Generate Nomor Proposal Terformat
     * panggil ini dengan: ProposalNumberFormatted::generate()
     */
    public static function generate()
    {
        $setting = self::first(); 

        if (!$setting) {
            return "FORMAT-NOT-SET";
        }

        $paddedNumber = str_pad($setting->next_number, $setting->padding, '0', STR_PAD_LEFT);

        $fullNumber = $setting->prefix . $paddedNumber;

        $setting->increment('next_number');

        return $fullNumber;
    }
}
