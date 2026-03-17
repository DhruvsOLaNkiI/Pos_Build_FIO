import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/customer-app', // Defaulting to the backend Customer App routes
});

// Add a request interceptor to attach the customer token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
