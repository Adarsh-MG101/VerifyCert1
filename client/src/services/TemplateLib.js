/**
 * Template Service
 * Handles all template-related API calls
 */

import { get, post, put, patch, del, upload, buildUrl } from './apiService';

/**
 * Get all templates with optional filters
 * @param {object} params - Query parameters (search, page, limit)
 * @returns {Promise<{templates: array, total: number, pages: number}>}
 */
export const getTemplates = async (params = {}) => {
    const endpoint = buildUrl('/api/templates', params);
    const response = await get(endpoint);
    return response.json();
};

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<object>}
 */
export const getTemplateById = async (templateId) => {
    const response = await get(`/api/templates/${templateId}`);
    return response.json();
};

/**
 * Upload a new template
 * @param {FormData} formData - Form data containing template file and metadata
 * @returns {Promise<object>}
 */
export const uploadTemplate = async (formData) => {
    const response = await upload('/api/templates/upload', formData);
    return response.json();
};

/**
 * Update template name
 * @param {string} templateId - Template ID
 * @param {string} name - New template name
 * @returns {Promise<object>}
 */
export const updateTemplateName = async (templateId, name) => {
    const response = await put(`/api/templates/${templateId}`, { name });
    return response.json();
};

/**
 * Toggle template status (enable/disable)
 * @param {string} templateId - Template ID
 * @returns {Promise<object>}
 */
export const toggleTemplateStatus = async (templateId) => {
    const response = await patch(`/api/templates/${templateId}/toggle`);
    return response.json();
};

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
export const deleteTemplate = async (templateId) => {
    const response = await del(`/api/templates/${templateId}`);
    return response.json();
};

/**
 * Get template placeholders
 * @param {string} templateId - Template ID
 * @returns {Promise<{placeholders: array}>}
 */
export const getTemplatePlaceholders = async (templateId) => {
    const response = await get(`/api/templates/${templateId}/placeholders`);
    return response.json();
};

export default {
    getTemplates,
    getTemplateById,
    uploadTemplate,
    updateTemplateName,
    toggleTemplateStatus,
    deleteTemplate,
    getTemplatePlaceholders,
};
