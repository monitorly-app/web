<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServerUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'hostname' => 'required|string|max:255',
            'ip_address' => 'nullable|ip',
            'port' => 'nullable|integer|min:1|max:65535',
            'description' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The server name is required.',
            'name.max' => 'The server name may not be greater than 255 characters.',
            'hostname.required' => 'The hostname is required.',
            'hostname.max' => 'The hostname may not be greater than 255 characters.',
            'ip_address.ip' => 'The IP address must be a valid IP address.',
            'port.integer' => 'The port must be an integer.',
            'port.min' => 'The port must be at least 1.',
            'port.max' => 'The port may not be greater than 65535.',
            'description.max' => 'The description may not be greater than 1000 characters.',
        ];
    }
}
