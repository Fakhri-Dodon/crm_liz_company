import axios from 'axios';

const leadsService = {
    async getAll() {
        try {
            console.log('📞 GET /api/leads');
            const response = await axios.get('/api/leads');
            console.log('✅ GET Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ GET Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async create(data) {
        try {
            console.log('📝 POST /api/leads', data);
            const response = await axios.post('/api/leads', data);
            console.log('✅ POST Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ POST Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async update(id, data) {
        try {
            console.log('📝 PUT /api/leads/' + id, data);
            const response = await axios.put(`/api/leads/${id}`, data);
            console.log('✅ PUT Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ PUT Error:', error.response?.data || error.message);
            throw error;
        }
    },

    async delete(id) {
        try {
            console.log('🗑️ DELETE /api/leads/' + id);
            const response = await axios.delete(`/api/leads/${id}`);
            console.log('✅ DELETE Response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ DELETE Error:', error.response?.data || error.message);
            throw error;
        }
    },
};

export default leadsService;