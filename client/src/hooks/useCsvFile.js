import { useState, useCallback } from 'react';

/**
 * Hook for handling CSV file uploads and row counting
 * @returns {Object} { file, rowCount, handleFileChange, resetFile }
 */
export const useCsvFile = () => {
    const [file, setFile] = useState(null);
    const [rowCount, setRowCount] = useState(0);

    const handleFileChange = useCallback((e, onFileLoaded) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                // Count lines, filter out empty ones
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
                // Subtract 1 for the header
                const count = Math.max(0, lines.length - 1);
                setRowCount(count);
                if (onFileLoaded) onFileLoaded(selectedFile, count);
            };
            reader.readAsText(selectedFile);
        } else {
            setRowCount(0);
            if (onFileLoaded) onFileLoaded(null, 0);
        }
    }, []);

    const resetFile = useCallback(() => {
        setFile(null);
        setRowCount(0);
    }, []);

    return {
        file,
        setFile,
        rowCount,
        handleFileChange,
        resetFile
    };
};
