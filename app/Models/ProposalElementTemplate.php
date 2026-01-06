<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class ProposalElementTemplate
 * 
 * @property string $id
 * @property string $name
 * @property array $content_json
 * @property string $preview_image
 * @property string|null $html_output
 * @property string|null $css_output
 * @property string|null $created_by
 * @property string|null $updated_by
 * @property string|null $deleted_by
 * @property int $deleted
 * @property string|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Collection|Proposal[] $proposals
 *
 * @package App\Models
 */
class ProposalElementTemplate extends Model
{
	use HasFactory, SoftDeletes;

	protected $table = 'proposal_element_template';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

	protected $casts = [
		'content_json' => 'json',
		'deleted' => 'int'
	];

	protected $fillable = [
		'name',
		'slug',
		'preview_image',
		'html_output',
		'css_output',
		'created_by',
		'updated_by',
		'deleted_by',
		'deleted'
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
        });
    }

	public function proposals()
	{
		return $this->hasMany(Proposal::class);
	}
}
