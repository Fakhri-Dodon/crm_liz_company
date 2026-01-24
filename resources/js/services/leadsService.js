// leadsService.js - Versi untuk Inertia.js
import axios from 'axios';

// Buat instance axios dengan withCredentials: true
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true, // SANGAT PENTING: Kirim cookies/session
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// INTERCEPTOR untuk menangani CSRF token secara otomatis
api.interceptors.request.use(
    (config) => {
        // Ambil CSRF token dari meta tag (standar Laravel)
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        
        if (csrfToken) {
            config.headers['X-CSRF-TOKEN'] = csrfToken;
        }
        
        // Log untuk debugging
        console.log(`🔗 ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
            withCredentials: config.withCredentials,
            headers: config.headers
        });
        
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// INTERCEPTOR untuk handle 401
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Jika error 401 dan belum pernah retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            console.warn('⚠️ 401 Unauthorized - Session mungkin expired');
            
            // Tampilkan pesan ke user
            if (!window.location.pathname.includes('/login')) {
                alert('Session expired. Please login again.');
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

const leadsService = {
    async getAll(params = {}) {
        try {
            const response = await api.get('/leads', { params });
            return response;
        } catch (error) {
            console.error('GET /leads error:', error.response?.data || error.message);
            throw error;
        }
    },

    async create(data) {
        try {
            console.log('Creating lead with data:', data);
            const response = await api.post('/leads', data);
            return response;
        } catch (error) {
            console.error('POST /leads error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            // Tampilkan pesan error yang user-friendly
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.response?.status === 401) {
                throw new Error('Please login to continue');
            } else {
                throw new Error('Failed to create lead. Please try again.');
            }
        }
    },

    async update(id, data) {
        try {
            const response = await api.put(`/leads/${id}`, data);
            return response;
        } catch (error) {
            console.error('PUT /leads error:', error.response?.data || error.message);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await api.delete(`/leads/${id}`);
            return response;
        } catch (error) {
            console.error('DELETE /leads error:', error);
            throw error;
        }
    },
    
    // Test connection to verify auth
    async testAuth() {
        try {
            const response = await api.get('/user');
            return response.data;
        } catch (error) {
            console.error('Auth test failed:', error.response?.status);
            return null;
        }
    }
};

export default leadsService;