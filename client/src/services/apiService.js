import axios from 'axios';

/**
 * Base API Service
 * Centralized API configuration and HTTP client using Axios
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Shorthand methods that return data directly
 * This makes the implementation MUCH easier for the user
 */

export const get = async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
};

export const post = async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
};

export const put = async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
};

export const patch = async (url, data = {}, config = {}) => {
    const response = await api.patch(url, data, config);
    return response.data;
};

export const del = async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
};

export const upload = async (url, formData, config = {}) => {
    const response = await api.post(url, formData, {
        ...config,
        headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const buildUrl = (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
};

export const getApiUrl = (path = '') => {
    return `${API_BASE_URL}${path}`;
};

export default {
    api,
    get,
    post,
    put,
    patch,
    del,
    upload,
    buildUrl,
    getApiUrl,
    API_BASE_URL,
};
