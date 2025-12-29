import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    // Gunakan ENV jika ada, jika tidak gunakan hardcode (untuk build Koyeb)
    key: import.meta.env.VITE_REVERB_APP_KEY || 'lizeverywherekey',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'established-maxy-syntaxid-e1fbc0af.koyeb.app',
    // Deteksi otomatis port: 443 untuk produksi (Koyeb), 8080 untuk lokal
    wsPort: import.meta.env.VITE_REVERB_PORT || (import.meta.env.MODE === 'production' ? 443 : 8080),
    wssPort: import.meta.env.VITE_REVERB_PORT || (import.meta.env.MODE === 'production' ? 443 : 8080),
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    auth: {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        }
    }
});