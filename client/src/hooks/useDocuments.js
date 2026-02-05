import { useState, useEffect, useCallback } from 'react';
import { getDocuments } from '@/services/documentService';
import { useDebounce } from './useDebounce';

/**
 * Hook for managing and fetching documents with filters and pagination
 * @param {Object} initialFilters - Initial filter state
 * @param {number} limit - Documents per page
 * @returns {Object} Documents state and control functions
 */
export const useDocuments = (initialFilters = {}, limit = 10) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [page, setPage] = useState(1);

    const [filters, setFilters] = useState({
        search: '',
        startDate: '',
        endDate: '',
        templateId: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...initialFilters
    });

    const debouncedSearch = useDebounce(filters.search, 300);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDocuments({
                ...filters,
                search: debouncedSearch,
                page,
                limit
            });

            if (data && Array.isArray(data.documents)) {
                setDocuments(data.documents);
                setTotalPages(data.pages || 1);
                setTotalDocs(data.total || 0);
            } else {
                setDocuments([]);
                setTotalPages(1);
                setTotalDocs(0);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate, filters.templateId, filters.sortBy, filters.sortOrder, debouncedSearch, page, limit]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Reset page when search or date filters change (but NOT when just sorting)
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filters.startDate, filters.endDate, filters.templateId]);

    const updateFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            startDate: '',
            endDate: '',
            templateId: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        setPage(1);
    };

    return {
        documents,
        loading,
        totalPages,
        totalDocs,
        page,
        setPage,
        limit,
        filters,
        updateFilter,
        resetFilters,
        refreshDocuments: fetchDocuments
    };
};
