import { useState, useEffect, useCallback } from 'react';
import { getTemplates } from '@/services/TemplateLib';

/**
 * Hook for managing and fetching templates
 * @param {Object} options - Fetch options { onlyEnabled, limit }
 * @returns {Object} { templates, loading, error, refreshTemplates }
 */
export const useTemplates = (options = { limit: 1000 }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleTemplateSelect = useCallback((e, onSelect) => {
        const tId = e.target.value;
        const t = templates.find(x => x._id === tId);
        setSelectedTemplate(t || null);
        if (onSelect) onSelect(t);
    }, [templates]);

    const fetchTemplatesList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getTemplates(options);
            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }

            let fetchedTemplates = [];
            if (Array.isArray(data)) {
                fetchedTemplates = data;
            } else if (data && Array.isArray(data.templates)) {
                fetchedTemplates = data.templates;
            } else if (data) {
                console.warn('Unexpected template data format:', data);
            }
            setTemplates(fetchedTemplates);
            return fetchedTemplates;
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError(err.message || 'Failed to fetch templates');
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(options)]);

    useEffect(() => {
        fetchTemplatesList();
    }, [fetchTemplatesList]);

    return {
        templates,
        selectedTemplate,
        setSelectedTemplate,
        handleTemplateSelect,
        loading,
        error,
        refreshTemplates: fetchTemplatesList
    };
};
