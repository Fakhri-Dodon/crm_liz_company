import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

// Request interceptor untuk menambahkan CSRF token
axiosInstance.interceptors.request.use(
    (config) => {
        // Coba ambil CSRF token dari meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            config.headers['X-CSRF-TOKEN'] = csrfToken;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        
        // Handle specific errors
        if (error.response?.status === 403) {
            console.warn('Access forbidden - check CSRF token or authentication');
        }
        
        if (error.response?.status === 422) {
            console.warn('Validation error:', error.response.data.errors);
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;