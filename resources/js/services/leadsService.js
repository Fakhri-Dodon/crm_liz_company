// resources/js/services/leadsService.js
import axios from "./axios";

export default {
  getAll: async () => {
    try {
      console.log('📞 GET /api/leads');
      const response = await axios.get("/leads");
      console.log('✅ GET Response:', response.data.length, 'leads');
      return response;
    } catch (err) {
      console.error('❌ GET Error:', err);
      throw err;
    }
  },
  
  create: (data) => {
    console.log('📞 POST /api/leads', data);
    return axios.post("/leads", data);
  },
  
  update: (id, data) => {
    console.log('📞 PUT /api/leads/' + id, data);
    return axios.put(`/leads/${id}`, data);
  },
  
  delete: async (id) => {
    try {
      console.log('🗑️ DELETE /api/leads/' + id);
      const response = await axios.delete(`/leads/${id}`);
      console.log('✅ DELETE Response (HARD DELETE):', response.data);
      return response;
    } catch (err) {
      console.error('❌ DELETE Error:', err);
      throw err;
    }
  },
  
  // Optional: soft delete
  softDelete: async (id) => {
    try {
      console.log('🗑️ SOFT DELETE /api/leads/' + id + '/soft');
      const response = await axios.delete(`/leads/${id}/soft`);
      console.log('✅ SOFT DELETE Response:', response.data);
      return response;
    } catch (err) {
      console.error('❌ SOFT DELETE Error:', err);
      throw err;
    }
  },
};