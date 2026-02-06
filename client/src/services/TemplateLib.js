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
    return get(endpoint);
};

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<object>}
 */
export const getTemplateById = async (templateId) => {
    return get(`/api/templates/${templateId}`);
};

/**
 * Upload a new template
 * @param {FormData} formData - Form data containing template file and metadata
 * @returns {Promise<object>}
 */
export const uploadTemplate = async (formData) => {
    return upload('/api/templates', formData);
};

/**
 * Update template name
 * @param {string} templateId - Template ID
 * @param {string} name - New template name
 * @returns {Promise<object>}
 */
export const updateTemplateName = async (templateId, name) => {
    return put(`/api/templates/${templateId}`, { name });
};

/**
 * Toggle template status (enable/disable)
 * @param {string} templateId - Template ID
 * @returns {Promise<object>}
 */
export const toggleTemplateStatus = async (templateId) => {
    return patch(`/api/templates/${templateId}/toggle`);
};

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
export const deleteTemplate = async (templateId) => {
    return del(`/api/templates/${templateId}`);
};

/**
 * Save Visual Template data
 * @param {string} templateId 
 * @param {object} data - { canvasData, placeholders }
 */
export const saveVisualTemplate = async (templateId, data) => {
    return put(`/api/templates/${templateId}/visual`, data);
};

/**
 * Get template placeholders
 * @param {string} templateId - Template ID
 * @returns {Promise<{placeholders: array}>}
 */
export const getTemplatePlaceholders = async (templateId) => {
    return get(`/api/templates/${templateId}/placeholders`);
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
