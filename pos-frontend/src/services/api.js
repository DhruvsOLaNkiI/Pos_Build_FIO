import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// Add token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Multi-tenant Store Routing
    const activeStore = localStorage.getItem('activeStore');
    if (activeStore) {
        config.headers['x-store-id'] = activeStore;
    }

    return config;
});

// Handle 401 responses (expired token) — do NOT redirect on 403 (pending approval)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
