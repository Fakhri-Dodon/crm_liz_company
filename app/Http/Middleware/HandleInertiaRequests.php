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

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,
            ],
            
            'csrf_token' => csrf_token(),
        ]);
    }
}