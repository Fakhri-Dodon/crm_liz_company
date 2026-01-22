<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use App\Models\Lead;
use App\Observers\LeadObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->app->bind('path.public', function() {
            return base_path('public');
        });

        // Cek environment dari .env
        if (app()->environment('production')) {
            URL::forceScheme('https');
            $this->app['request']->server->set('HTTPS', 'on');
            config([
                'session.secure' => true,
            ]);
        }

        // ========== REGISTER LEAD OBSERVER (COMMENT DULU UNTUK DEBUG) ==========
        Lead::observe(LeadObserver::class);
        // ============================================
        
        // UNCOMMENT SETELAH OBSERVER DIPERBAIKI:
        // Lead::observe(LeadObserver::class);
    }
}