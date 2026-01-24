// authService.js - Contoh service untuk login
import axios from 'axios';

const authService = {
    async login(credentials) {
        try {
            console.log('🔐 Login attempt:', credentials.email);
            const response = await axios.post('/api/login', credentials);
            
            if (response.data.token) {
                // Simpan token
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                console.log('✅ Login successful, token saved');
                return response.data;
            }
        } catch (error) {
            console.error('❌ Login error:', error.response?.data || error.message);
            throw error;
        }
    },
    
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        console.log('👋 Logged out');
    },
    
    getToken() {
        return localStorage.getItem('auth_token');
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    isAuthenticated() {
        return !!this.getToken();
    }
};

export default authService;