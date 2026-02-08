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
            const counts = {}; // To track occurrences for true duplicate detection
            const regex = /\{\{(.*?)\}\}/g;

            // 1. Primary Detection & Counting: Mammoth (Unified Text Scan)
            // Mammoth is best for seeing the document's flow and counting actual occurrences.
            let docText = "";
            try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                docText = result.value;
                let match;
                while ((match = regex.exec(docText)) !== null) {
                    const tag = match[1].trim().toUpperCase();
                    if (tag) {
                        allMatches.add(tag);
                        counts[tag] = (counts[tag] || 0) + 1;
                    }
                }
            } catch (e) {
                console.error("Mammoth scan failed:", e);
            }

            // 2. Supplemental Detection: PizZip (Deep XML Scan)
            // Good for catching fragmented tags or tags in areas Mammoth might skip.
            // We only increment counts if Mammoth missed something, or we can just add to detection set.
            xmlFiles.forEach(file => {
                try {
                    const content = file.asText();
                    const cleanText = content.replace(/<[^>]+>/g, '');
                    let match;
                    while ((match = regex.exec(cleanText)) !== null) {
                        const tag = match[1].trim().toUpperCase();
                        if (tag) {
                            allMatches.add(tag);
                            // If Mammoth detected this tag, we trust its count and ignore PizZip
                            // to avoid double counting or case-mismatch issues.
                            // Only if counts[tag] is undefined or 0 do we trust PizZip.
                            if (!counts[tag]) {
                                counts[tag] = (counts[tag] || 0) + 1;
                            }
                        }
                    }
                } catch (e) { }
            });

            // Filter out system tags
            const systemTags = ['QR', 'QRCODE', 'CERTIFICATE_ID', 'IMAGE QR', 'IMAGE_QR', 'CERTIFICATEID', 'ID'];
            const finalPlaceholders = Array.from(allMatches).filter(p => !systemTags.includes(p));

            // Identify true duplicates (tags appearing multiple times in the doc)
            const duplicates = Object.keys(counts).filter(tag => {
                return !systemTags.includes(tag) && counts[tag] > 1;
            });

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
