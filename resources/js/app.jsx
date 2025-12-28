import '../css/app.css';
import './bootstrap';
import './i18n'; // Import tanpa variabel jika hanya untuk inisialisasi, 
                 // atau 'import i18n from "./i18n"' jika butuh akses langsung

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import i18n from './i18n'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const queryClient = new QueryClient();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Ambil config dari props yang dikirim Laravel via HandleInertiaRequests
        const appConfig = props.initialPage.props.app_config;

        if (appConfig) {
            const savedLanguage = localStorage.getItem('i18nextLng');
            if (!savedLanguage) {
                const langCode = appConfig.default_language === 'Indonesia' ? 'id' : 'en';
                i18n.changeLanguage(langCode);
            }
        }

        root.render(
            <QueryClientProvider client={queryClient}>
                <App {...props} />
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});