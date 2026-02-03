/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { get, post } from './apiService';

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = async (email, password) => {
    const response = await post('/api/auth/login', { email, password });
    return response.json();
};

/**
 * Register new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{message: string}>}
 */
export const register = async (name, email, password) => {
    const response = await post('/api/auth/register', { name, email, password });
    return response.json();
};

/**
 * Verify authentication token
 * @returns {Promise<{user: object}>}
 */
export const verifyToken = async () => {
    const response = await get('/api/auth/verify');
    return response.json();
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
    const response = await post('/api/auth/logout');
    return response.json();
};

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const updatePassword = async (currentPassword, newPassword) => {
    const response = await post('/api/auth/update-password', {
        currentPassword,
        newPassword,
    });
    return response.json();
};

export default {
    login,
    register,
    verifyToken,
    logout,
    updatePassword,
};
