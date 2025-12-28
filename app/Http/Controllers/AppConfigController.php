<?php

namespace App\Http\Controllers;

use App\Models\AppConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AppConfigController extends Controller
{
    public function store(Request $request)
    {
        // 1. Ambil config aktif
        $currentConfig = AppConfig::where('deleted', 0)->first();

        // 2. Validasi (Semua field tetap dipertahankan)
        $validatedData = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'default_language' => 'sometimes|string',
            'allow_language_change' => 'sometimes|boolean',
            'logo_path' => 'nullable|string',
            'doc_logo_path' => 'nullable|string',
            'lead_user_base_visibility' => 'sometimes|boolean',
            'lead_default_filter_by_login' => 'sometimes|boolean',
            'proposal_user_base_visibility' => 'sometimes|boolean',
            'proposal_default_filter_by_login' => 'sometimes|boolean',
        ]);

        // --- MULAI PERUBAHAN KHUSUS BOOLEAN ---
        // List semua field boolean yang sering bermasalah saat pengiriman dari JS
        $booleanFields = [
            'allow_language_change',
            'lead_user_base_visibility',
            'lead_default_filter_by_login',
            'proposal_user_base_visibility',
            'proposal_default_filter_by_login'
        ];

        foreach ($booleanFields as $field) {
            if ($request->has($field)) {
                // Memastikan input true/false atau "true"/"false" dikonversi ke 1 atau 0
                $validatedData[$field] = filter_var($request->input($field), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
        }
        // --- AKHIR PERUBAHAN KHUSUS BOOLEAN ---

        // 4. Proses Versioning (Replicate)
        if ($currentConfig) {
            $newConfig = $currentConfig->replicate();
            
            // Update record lama menjadi deleted
            $currentConfig->update(['deleted' => 1]);

            // Overwrite data lama dengan data baru yang masuk (baik string maupun boolean)
            foreach ($validatedData as $key => $value) {
                $newConfig->{$key} = $value;
            }

            $newConfig->deleted = 0;
            $newConfig->created_by = Auth::id();
            $newConfig->save();
        } else {
            AppConfig::create(array_merge($validatedData, [
                'deleted' => 0,
                'created_by' => Auth::id()
            ]));
        }

        return back();
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,svg|max:2048',
            'type' => 'required|string|in:topbar,document'
        ]);

        // Cari config yang aktif
        $config = AppConfig::where('deleted', 0)->first();

        if (!$config) {
            return Redirect::back()->with('error', 'Configuration not found');
        }

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $type = $request->type;
            $column = ($type === 'topbar') ? 'logo_path' : 'doc_logo_path';
            $fileName = $type . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('app-assets', $fileName, 'public');

            // Update path logo di konfigurasi
            if ($config->$column && Storage::disk('public')->exists($config->$column)) {
                Storage::disk('public')->delete($config->$column);
            }
            
            $config->update([$column => $path]);
        }

        return Redirect::back()->with('success', 'Logo updated successfully');
    }
}