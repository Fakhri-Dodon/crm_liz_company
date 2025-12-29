<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\User;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        // Create dummy user if none exists
        if (app()->environment('local') && User::count() === 0) {
            User::create([
                'name' => 'Admin User',
                'email' => 'admin@lizcompany.com',
                'password' => bcrypt('password123'),
            ]);
        }

        $config = \DB::table('app_configs')->where('deleted', 0)->first();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role_id' => $request->user()->role_id,
                    'role_name' => $request->user()->role ? $request->user()->role->name : null,
                ] : null,
                'unreadNotificationsCount' => $request->user() ? $request->user()->unreadNotifications->count() : 0,
                'notifications' => $request->user() ? $request->user()->unreadNotifications : [],
            ],
            'app_config' => [
                'default_language'      => $config->default_language ?? 'Indonesia',
                'allow_language_change' => (bool) ($config->allow_language_change ?? true),
                'logo_path'             => $config->logo_path ?? null,
                'doc_logo_path'         => $config->doc_logo_path ?? null,
                'company_name'          => $config->company_name ?? 'Liz Company',
            ],
            
            'csrf_token' => csrf_token(),
        ]);
    }
}