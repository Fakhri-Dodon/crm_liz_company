<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */

    public function rules(): array
    {
        return [
            'company_name'   => 'required|string|max:255',
            'contact_person' => 'required|string|max:100',
            'email'          => 'nullable|email',
            'phone'          => 'nullable|string|max:50',
            'address'        => 'nullable|string',
            'assigned_to'    => 'nullable|string|max:100',
        ];
    }


}
