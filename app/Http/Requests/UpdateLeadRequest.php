<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'company_name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'contact_person' => 'sometimes|required|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'lead_statuses_id' => 'required|exists:lead_statuses,id', // INI YANG PERLU DIPERBAIKI
            'assigned_to' => 'nullable|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
        ];
    }
    
    public function messages()
    {
        return [
            'lead_statuses_id.required' => 'Status is required.',
            'lead_statuses_id.exists' => 'Selected status does not exist.',
        ];
    }
}