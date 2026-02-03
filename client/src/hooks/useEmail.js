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
            const response = await sendCertificateEmail(targetId, email);
            const data = await response.json();

            if (response.ok) {
                showAlert('Success', successMessage, 'info');
                setSending(false);
                return true;
            } else {
                showAlert('Email Failed', data.error || errorMessage, 'error');
                setSending(false);
                return false;
            }
        } catch (err) {
            console.error('Email error:', err);
            showAlert('Error', 'An unexpected error occurred while sending email', 'error');
            setSending(false);
            return false;
        }
    };

    return {
        sending,
        sendEmail
    };
};
