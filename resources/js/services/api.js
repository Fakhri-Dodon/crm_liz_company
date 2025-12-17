import axios from 'axios';

export const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
    },
    withCredentials: true,
});

export const api = {
    appConfig: {
        get: () => apiClient.get('/app-config').then(r => r.data),
        update: (id, data) => apiClient.put(`/app-config/${id}`, data),
        create: (data) => apiClient.post('/app-config', data),
    },
};
