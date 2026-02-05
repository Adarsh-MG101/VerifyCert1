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
        if (!selectedFile) return;

        setFile(selectedFile);
        setDetectedPlaceholders([]);
        setDuplicatePlaceholders([]);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();

            // Primary Detection: PizZip (Deep XML Scan)
            // Using dynamic import to avoid SSR issues in Next.js
            const PizZip = (await import('pizzip')).default;
            const zip = new PizZip(arrayBuffer);
            const xmlFiles = zip.file(/\.xml$/);

            const allMatches = new Set();
            const rawMatches = []; // For duplicate detection
            const regex = /\{\{(.*?)\}\}/g;

            xmlFiles.forEach(file => {
                try {
                    const content = file.asText();
                    // Strip XML tags to bridge fragmentation like {{ <tag> NAME </tag> }}
                    const cleanText = content.replace(/<[^>]+>/g, '');
                    let match;
                    while ((match = regex.exec(cleanText)) !== null) {
                        const tag = match[1].trim();
                        if (tag) {
                            rawMatches.push(tag.toUpperCase());
                            allMatches.add(tag.toUpperCase());
                        }
                    }
                } catch (e) { }
            });

            // Back-up: Mammoth (Standard Text Scan)
            try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                let match;
                while ((match = regex.exec(result.value)) !== null) {
                    const tag = match[1].trim();
                    if (tag) {
                        rawMatches.push(tag.toUpperCase());
                        allMatches.add(tag.toUpperCase());
                    }
                }
            } catch (e) { }

            // Filter out system tags
            const systemTags = ['QR', 'QRCODE', 'CERTIFICATE_ID', 'IMAGE QR', 'IMAGE_QR', 'CERTIFICATEID', 'ID'];
            const finalPlaceholders = Array.from(allMatches).filter(p => !systemTags.includes(p));

            // Find true duplicates (tags appearing multiple times in the doc)
            const counts = {};
            rawMatches.forEach(tag => {
                if (!systemTags.includes(tag)) {
                    counts[tag] = (counts[tag] || 0) + 1;
                }
            });
            const duplicates = Object.keys(counts).filter(tag => counts[tag] > 1);

            setDetectedPlaceholders(finalPlaceholders);
            setDuplicatePlaceholders(duplicates);

            if (onAnalyzed) onAnalyzed(selectedFile, finalPlaceholders, duplicates);

        } catch (err) {
            console.error("Error analyzing file:", err);
            // We don't use showAlert here because we don't have access to UIContext, 
            // but the parent component will see empty placeholders and show its own error UI.
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
