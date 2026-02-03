/**
 * Dashboard Service
 * Handles dashboard-specific API calls (stats, analytics, etc.)
 */

import { get } from './apiService';

/**
 * Get dashboard statistics
 * @returns {Promise<{totalTemplates: number, totalDocuments: number, pendingVerifications: number}>}
 */
export const getDashboardStats = async () => {
    return get('/api/stats');
};

/**
 * Get user activity logs
 * @param {object} params - Query parameters (page, limit)
 * @returns {Promise<{activities: array, total: number}>}
 */
export const getUserActivity = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/auth/activity?${queryString}` : '/api/auth/activity';
    return get(endpoint);
};

/**
 * Get recent documents
 * @param {number} limit - Number of recent documents to fetch
 * @returns {Promise<array>}
 */
export const getRecentDocuments = async (limit = 5) => {
    return get(`/api/documents?limit=${limit}&sort=-createdAt`);
};

/**
 * Get analytics data
 * @param {string} period - Time period (week, month, year)
 * @returns {Promise<object>}
 */
export const getAnalytics = async (period = 'month') => {
    return get(`/api/analytics?period=${period}`);
};

export default {
    getDashboardStats,
    getUserActivity,
    getRecentDocuments,
    getAnalytics,
};
