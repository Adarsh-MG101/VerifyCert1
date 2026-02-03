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
    return post('/api/auth/login', { email, password });
};

/**
 * Register new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{message: string}>}
 */
export const register = async (name, email, password) => {
    return post('/api/auth/register', { name, email, password });
};

/**
 * Verify authentication token
 * @returns {Promise<{user: object}>}
 */
export const verifyToken = async () => {
    return get('/api/auth/verify');
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
    return post('/api/auth/logout');
};

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const updatePassword = async (currentPassword, newPassword) => {
    return post('/api/auth/update-password', {
        currentPassword,
        newPassword,
    });
};

export default {
    login,
    register,
    verifyToken,
    logout,
    updatePassword,
};
