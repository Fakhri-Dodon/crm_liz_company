// leadsService.js - Versi tanpa auth
import axios from 'axios';

// Buat instance axios SEDERHANA tanpa token
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// HAPUS interceptor untuk token
// TAMBAHKAN error handling yang lebih baik

const leadsService = {
    async getAll() {
        try {
            console.log('📞 GET /leads');
            const response = await api.get('/leads');
            console.log('✅ GET Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ GET Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    async create(data) {
        try {
            console.log('📝 POST /leads', data);
            const response = await api.post('/leads', data);
            console.log('✅ POST Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ POST Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async update(id, data) {
        try {
            console.log('📝 PUT /leads/' + id, data);
            const response = await api.put(`/leads/${id}`, data);
            console.log('✅ PUT Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ PUT Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async delete(id) {
        try {
            console.log('🗑️ DELETE /leads/' + id);
            console.log('Full URL:', `/api/leads/${id}`);
            
            const response = await api.delete(`/leads/${id}`);
            console.log('✅ DELETE Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ DELETE Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });
            throw error;
        }
    },
};

export default leadsService;