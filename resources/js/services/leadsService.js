import axios from './axios';

const leadsService = {
    getAll() {
        return axios.get('/leads');
    },

    getById(id) {
        return axios.get(`/leads/${id}`);
    },

    create(payload) {
        return axios.post('/leads', payload);
    },

    update(id, payload) {
        return axios.put(`/leads/${id}`, payload);
    },

    delete(id) {
        return axios.delete(`/leads/${id}`);
    },
};

export default leadsService;
