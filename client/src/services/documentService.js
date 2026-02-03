/**
 * Document Service
 * Handles all document/certificate-related API calls
 */

import { get, post, upload, buildUrl } from './apiService';

/**
 * Get all documents with optional filters
 * @param {object} params - Query parameters (search, templateId, startDate, endDate, page, limit)
 * @returns {Promise<{documents: array, total: number, pages: number}>}
 */
export const getDocuments = async (params = {}) => {
    const endpoint = buildUrl('/api/documents', params);
    return get(endpoint);
};

/**
 * Get a single document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<object>}
 */
export const getDocumentById = async (documentId) => {
    return get(`/api/documents/${documentId}`);
};

/**
 * Generate a single certificate
 * @param {string} templateId - Template ID
 * @param {object} data - Certificate data (key-value pairs for placeholders)
 * @returns {Promise<object>}
 */
export const generateCertificate = async (templateId, data) => {
    return post('/api/generate', { templateId, data });
};

/**
 * Generate multiple certificates in bulk
 * @param {FormData} formData - Form data containing template ID and CSV file
 * @returns {Promise<object>}
 */
export const generateBulkCertificates = async (formData) => {
    return upload('/api/generate-bulk', formData);
};

/**
 * Send certificate via email
 * @param {string} documentId - Document ID
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<{message: string}>}
 */
export const sendCertificateEmail = async (documentId, recipientEmail) => {
    return post('/api/send-email', {
        documentId,
        recipientEmail,
    });
};

/**
 * Verify a document by its unique ID
 * @param {string} documentId - Document unique ID
 * @returns {Promise<{valid: boolean, data: object}>}
 */
export const verifyDocument = async (documentId) => {
    return get(`/api/verify/${documentId}`);
};

export default {
    getDocuments,
    getDocumentById,
    generateCertificate,
    generateBulkCertificates,
    sendCertificateEmail,
    verifyDocument,
};
