/**
 * User Service
 * Handles user profile and settings API calls
 */

import { get, put, post } from './apiService';

/**
 * Get current user profile
 * @returns {Promise<object>}
 */
export const getUserProfile = async () => {
    return get('/api/user/profile');
};

/**
 * Update user profile
 * @param {object} data - Profile data (name, email, etc.)
 * @returns {Promise<object>}
 */
export const updateUserProfile = async (data) => {
    return put('/api/user/profile', data);
};

/**
 * Update user settings
 * @param {object} settings - User settings
 * @returns {Promise<object>}
 */
export const updateUserSettings = async (settings) => {
    return put('/api/user/settings', settings);
};

/**
 * Get user settings
 * @returns {Promise<object>}
 */
export const getUserSettings = async () => {
    return get('/api/user/settings');
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const changePassword = async (currentPassword, newPassword) => {
    return post('/api/user/change-password', {
        currentPassword,
        newPassword,
    });
};

export default {
    getUserProfile,
    updateUserProfile,
    updateUserSettings,
    getUserSettings,
    changePassword,
};
