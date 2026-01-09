<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class UserActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            try {
                \DB::getPdo(); 
            } catch (\Exception $e) {
                \DB::reconnect();
            }
            try {
                Auth::user()->updateQuietly(['last_seen' => now()]);
            } catch (\Exception $e) {
                \Log::error("Update last_seen gagal: " . $e->getMessage());
            }
        }
        
        return $next($request);
    }
}