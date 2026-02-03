import { useState } from 'react';
import { sendCertificateEmail } from '@/services/documentService';
import { useUI } from '@/context/UIContext';

/**
 * Hook for handling email operations
 * @returns {Object} { sending, sendEmail }
 */
export const useEmail = () => {
    const [sending, setSending] = useState(false);
    const { showAlert } = useUI();

    /**
     * Send email with attachment/link
     * @param {string} targetId - Document ID or zip path
     * @param {string} email - Recipient email
     * @param {Object} options - { isZip: boolean, successMessage, errorMessage }
     */
    const sendEmail = async (targetId, email, options = {}) => {
        if (!targetId || !email) return false;

        const {
            successMessage = 'Email sent successfully!',
            errorMessage = 'Failed to send email'
        } = options;

        setSending(true);
        try {
            await sendCertificateEmail(targetId, email);
            showAlert('Success', successMessage, 'info');
            setSending(false);
            return true;
        } catch (err) {
            console.error('Email error:', err);
            const errorMsg = err.response?.data?.error || errorMessage;
            showAlert('Email Failed', errorMsg, 'error');
            setSending(false);
            return false;
        }
    };

    return {
        sending,
        sendEmail
    };
};
