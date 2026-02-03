/**
 * Base API Service
 * Centralized API configuration and HTTP client
 */

// Get API URL from environment variable with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get the authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

/**
 * Base fetch wrapper with common configurations
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
const apiFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);
        return response;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>}
 */
export const get = async (endpoint, options = {}) => {
    const response = await apiFetch(endpoint, {
        method: 'GET',
        ...options,
    });
    return response;
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>}
 */
export const post = async (endpoint, data = {}, options = {}) => {
    const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
    });
    return response;
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>}
 */
export const put = async (endpoint, data = {}, options = {}) => {
    const response = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
    });
    return response;
};

/**
 * PATCH request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>}
 */
export const patch = async (endpoint, data = {}, options = {}) => {
    const response = await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
    });
    return response;
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>}
 */
export const del = async (endpoint, options = {}) => {
    const response = await apiFetch(endpoint, {
        method: 'DELETE',
        ...options,
    });
    return response;
};

/**
 * Upload file with FormData
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data with files
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>}
 */
export const upload = async (endpoint, formData, options = {}) => {
    const token = getAuthToken();

    const config = {
        method: 'POST',
        body: formData,
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);
        return response;
    } catch (error) {
        console.error(`Upload Error (${endpoint}):`, error);
        throw error;
    }
};

/**
 * Build URL with query parameters
 * @param {string} endpoint - Base endpoint
 * @param {object} params - Query parameters
 * @returns {string}
 */
export const buildUrl = (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
};

/**
 * Get the full API URL for a given path
 * Useful for direct links (e.g., file downloads)
 * @param {string} path - Path relative to API base
 * @returns {string}
 */
export const getApiUrl = (path = '') => {
    return `${API_BASE_URL}${path}`;
};

export default {
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
