import { useState, useCallback } from 'react';
import mammoth from 'mammoth';

/**
 * Hook for handling DOCX template uploads and placeholder detection
 * @returns {Object} { file, detectedPlaceholders, duplicatePlaceholders, handleFileChange, resetFile }
 */
export const useDocxTemplate = () => {
    const [file, setFile] = useState(null);
    const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);
    const [duplicatePlaceholders, setDuplicatePlaceholders] = useState([]);

    const handleFileChange = useCallback(async (e, onAnalyzed) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setDetectedPlaceholders([]);
        setDuplicatePlaceholders([]);

        if (selectedFile) {
            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                const text = result.value;

                // Match all placeholders {{...}}
                const allMatches = [];
                const regex = /\{\{(.*?)\}\}/g;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    allMatches.push(match[1].trim());
                }

                // Filter for strictly uppercase only
                const uppercasePlaceholders = allMatches.filter(p => p !== "" && /^[A-Z0-9_]+$/.test(p));

                // Find duplicates
                const seen = new Set();
                const duplicates = new Set();
                uppercasePlaceholders.forEach(p => {
                    if (seen.has(p)) duplicates.add(p);
                    seen.add(p);
                });

                // Unique list for display (filter out internal tags)
                const uniqueDisplay = Array.from(new Set(uppercasePlaceholders))
                    .filter(p => p !== 'QR' && p !== 'QRCODE' && p !== 'CERTIFICATE_ID');

                setDetectedPlaceholders(uniqueDisplay);
                setDuplicatePlaceholders(Array.from(duplicates));

                if (onAnalyzed) onAnalyzed(selectedFile, uniqueDisplay, Array.from(duplicates));

            } catch (err) {
                console.error("Error analyzing file:", err);
            }
        }
    }, []);

    const resetFile = useCallback(() => {
        setFile(null);
        setDetectedPlaceholders([]);
        setDuplicatePlaceholders([]);
    }, []);

    return {
        file,
        setFile,
        detectedPlaceholders,
        duplicatePlaceholders,
        handleFileChange,
        resetFile
    };
};
