<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class Proposal
 * 
 * @property string $id
 * @property string $proposal_number_formated_id
 * @property string $proposal_statuses_id
 * @property string $proposal_element_template_id
 * @property string $lead_id
 * @property string $proposal_number
 * @property string $title
 * @property Carbon|null $sent_at
 * @property Carbon|null $opened_at
 * @property string $status
 * @property array $content_json
 * @property string $view_token
 * @property string|null $created_by
 * @property string|null $updated_by
 * @property string|null $deleted_by
 * @property int $deleted
 * @property string|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Lead $lead
 * @property ProposalElementTemplate $proposal_element_template
 * @property ProposalNumberFormated $proposal_number_formated
 * @property ProposalStatus $proposal_status
 *
 * @package App\Models
 */
class Proposal extends Model
{
	use HasFactory, SoftDeletes;

	protected $table = 'proposals';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

	protected $casts = [
		'sent_at' => 'datetime',
		'opened_at' => 'datetime',
		'content_json' => 'json',
		'deleted' => 'int'
	];

	protected $hidden = [
		'view_token'
	];

	protected $fillable = [
		'proposal_number_formated_id',
		'proposal_statuses_id',
		'proposal_element_template_id',
		'lead_id',
		'proposal_number',
		'title',
		'sent_at',
		'opened_at',
		'status',
		'content_json',
		'view_token',
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
            
            if (empty($model->proposal_statuses_id)) {
                $model->proposal_statuses_id = '4de1376f-aa1d-4b72-9d12-4716fc648b7d';
            }
            
            if (empty($model->status)) {
                $model->status = 'draft';
            }
        });
    }

	public function lead()
	{
		return $this->belongsTo(Lead::class);
	}

	public function proposal_element_template()
	{
		return $this->belongsTo(ProposalElementTemplate::class);
	}

	public function proposal_number_formated()
	{
		return $this->belongsTo(ProposalNumberFormated::class);
	}

	public function proposal_status()
	{
		return $this->belongsTo(ProposalStatus::class, 'proposal_statuses_id');
	}

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }
}
