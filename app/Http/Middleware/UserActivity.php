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
        if (auth()->check()) {
            try {
                \DB::reconnect(); 

                auth()->user()->updateQuietly([
                    'last_seen' => now()
                ]);
            } catch (\Exception $e) {
                \Log::error("Gagal update last_seen: " . $e->getMessage());
            }
        } 
        
        return $next($request);
    }
}