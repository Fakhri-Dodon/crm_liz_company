import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    // 1. Key: Gunakan ENV, jika kosong gunakan key Reverb Anda
    key: import.meta.env.VITE_REVERB_APP_KEY || 'lizeverywherekey',
    
    // 2. Host: Gunakan ENV, jika kosong gunakan domain Koyeb Anda
    wsHost: import.meta.env.VITE_REVERB_HOST || 'established-maxy-syntaxid-e1fbc0af.koyeb.app',
    
    // 3. Port: Di lokal biasanya 8080, di Koyeb/Produksi harus 443 (HTTPS)
    wsPort: import.meta.env.VITE_REVERB_PORT || (import.meta.env.MODE === 'production' ? 443 : 8080),
    wssPort: import.meta.env.VITE_REVERB_PORT || (import.meta.env.MODE === 'production' ? 443 : 8080),
    
    // 4. ForceTLS: Otomatis true jika di produksi
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    
    enabledTransports: ['ws', 'wss'],
    auth: {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
    }
});