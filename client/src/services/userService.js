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
    const response = await get('/api/user/profile');
    return response.json();
};

/**
 * Update user profile
 * @param {object} data - Profile data (name, email, etc.)
 * @returns {Promise<object>}
 */
export const updateUserProfile = async (data) => {
    const response = await put('/api/user/profile', data);
    return response.json();
};

/**
 * Update user settings
 * @param {object} settings - User settings
 * @returns {Promise<object>}
 */
export const updateUserSettings = async (settings) => {
    const response = await put('/api/user/settings', settings);
    return response.json();
};

/**
 * Get user settings
 * @returns {Promise<object>}
 */
export const getUserSettings = async () => {
    const response = await get('/api/user/settings');
    return response.json();
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const changePassword = async (currentPassword, newPassword) => {
    const response = await post('/api/user/change-password', {
        currentPassword,
        newPassword,
    });
    return response.json();
};

export default {
    getUserProfile,
    updateUserProfile,
    updateUserSettings,
    getUserSettings,
    changePassword,
};
