import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import WebViewer from '@pdftron/webviewer';
import { getApiUrl } from '../services/apiService';

export default function TemplateEditor({ template, isOpen, onSave, onClose }) {
    const viewerDiv = useRef(null);
    const [instance, setInstance] = useState(null);
    const [status, setStatus] = useState('Initializing...');
    const [aiToolkit, setAiToolkit] = useState({ visible: false, x: 0, y: 0, text: '', mode: 'suggest', suggestion: '', reason: '', annot: null });
    const [aiLoading, setAiLoading] = useState(false);
    const [hoverTimeout, setHoverTimeout] = useState(null);

    // Use default placeholders if none defined
    const placeholders = template && template.placeholders && template.placeholders.length > 0
        ? template.placeholders
        : ['{{NAME}}', '{{DATE}}', '{{COURSE}}', '{{ID}}'];

    // Helper for showing alerts
    const showAlert = (title, message, type = 'info') => {
        console.log(`ALERT (${type.toUpperCase()}): ${title} - ${message}`);
        alert(`${title}\n\n${message}`);
    };

    // Initialize WebViewer ONCE when component mounts
    useEffect(() => {
        if (!viewerDiv.current || instance) return;

        WebViewer({
            path: '/webviewer',
            fullAPI: true,
            enableOfficeEditing: true,
        }, viewerDiv.current).then(inst => {
            setInstance(inst);
            console.log('WebViewer engine initialized (one-time)');
            setStatus('Ready');

            const { documentViewer, annotationManager, Annotations } = inst.Core;

            documentViewer.addEventListener('documentLoaded', () => {
                console.log('Document loaded');
                setStatus('Ready');
                inst.UI.setFitMode(inst.UI.FitMode.FitPage);
            });

            // AI Toolkit Trigger: Listen for text selection
            documentViewer.addEventListener('textSelected', (quads, text, pageNumber) => {
                if (pageNumber <= 0 || !text || text.trim().length < 2) {
                    setAiToolkit(prev => (prev.mode === 'suggest' ? { ...prev, visible: false } : prev));
                    return;
                }

                if (quads && quads.length > 0) {
                    const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
                    try {
                        const windowCoord = displayMode.pageToWindow({ x: quads[0].x1, y: quads[0].y1 }, pageNumber);

                        setAiToolkit({
                            visible: true,
                            x: windowCoord.x,
                            y: windowCoord.y - 60,
                            text: text.trim(),
                            mode: 'suggest',
                            suggestion: '',
                            reason: '',
                            annot: null
                        });
                    } catch (e) {
                        console.warn('Could not map selection to window coords:', e);
                    }
                }
            });

            // AI Error Annotation Click: Show correction toolkit
            annotationManager.addEventListener('annotationSelected', (annotations) => {
                const annot = annotations[0];
                if (annot && annot.getCustomData('ai_error')) {
                    const pageNumber = annot.PageNumber;
                    const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
                    const windowCoord = displayMode.pageToWindow({ x: annot.X, y: annot.Y }, pageNumber);

                    setAiToolkit({
                        visible: true,
                        x: windowCoord.x + (annot.Width / 2),
                        y: windowCoord.y - 80,
                        text: annot.getCustomData('original'),
                        suggestion: annot.getCustomData('suggestion'),
                        reason: annot.getCustomData('reason'),
                        mode: 'correct',
                        annot: annot
                    });
                } else {
                    setAiToolkit(prev => (prev.mode === 'correct' ? { ...prev, visible: false } : prev));
                }
            });

            // Hover detection for AI error annotations
            let currentHoveredAnnotId = null;
            const viewerElement = viewerDiv.current;
            if (viewerElement) {
                viewerElement.addEventListener('mousemove', (e) => {
                    const annots = annotationManager.getAnnotationsList();
                    const aiErrors = annots.filter(a => a.getCustomData('ai_error'));

                    // Check if mouse is over any AI error annotation
                    let hoveredAnnot = null;
                    for (const annot of aiErrors) {
                        const pageNumber = annot.PageNumber;
                        const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
                        const windowCoord = displayMode.pageToWindow({ x: annot.X, y: annot.Y }, pageNumber);
                        const windowCoordEnd = displayMode.pageToWindow({ x: annot.X + annot.Width, y: annot.Y + annot.Height }, pageNumber);

                        if (e.clientX >= windowCoord.x && e.clientX <= windowCoordEnd.x &&
                            e.clientY >= windowCoord.y && e.clientY <= windowCoordEnd.y) {
                            hoveredAnnot = annot;
                            break;
                        }
                    }

                    const annotId = hoveredAnnot ? hoveredAnnot.Id : null;

                    if (annotId !== currentHoveredAnnotId) {
                        currentHoveredAnnotId = annotId;

                        // Clear any existing timeout
                        if (hoverTimeout) {
                            console.log('🧹 Clearing AI toolkit timer');
                            clearTimeout(hoverTimeout);
                            setHoverTimeout(null);
                        }

                        if (hoveredAnnot) {
                            console.log('👀 Hovering over AI error, starting 3s timer...');
                            // Set new timeout for 3 seconds
                            const timeout = setTimeout(() => {
                                const pageNumber = hoveredAnnot.PageNumber;
                                const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
                                const windowCoord = displayMode.pageToWindow({ x: hoveredAnnot.X, y: hoveredAnnot.Y }, pageNumber);

                                setAiToolkit({
                                    visible: true,
                                    x: windowCoord.x + (hoveredAnnot.Width / 2),
                                    y: windowCoord.y - 80,
                                    text: hoveredAnnot.getCustomData('original'),
                                    suggestion: hoveredAnnot.getCustomData('suggestion'),
                                    reason: hoveredAnnot.getCustomData('reason'),
                                    mode: 'correct',
                                    annot: hoveredAnnot
                                });
                            }, 3000);

                            setHoverTimeout(timeout);
                        }
                    }
                });
            }

            documentViewer.addEventListener('loadError', (err) => {
                console.error('Load Error:', err);
                setStatus('Error: ' + err.message);
                alert('Document failed to load: ' + err.message);
            });

            // Add more detailed error logging
            documentViewer.addEventListener('loaderror', (err) => {
                console.error('Loader Error Event:', err);
            });

            documentViewer.addEventListener('error', (err) => {
                console.error('General Error Event:', err);
            });
        });
    }, []);

    // Load document when template changes and modal is open
    useEffect(() => {
        console.log('Load effect triggered:', { instance: !!instance, template: !!template, isOpen });

        if (!instance || !template || !isOpen) {
            console.log('Skipping load - missing:', { instance: !instance, template: !template, isOpen: !isOpen });
            return;
        }

        setStatus('Loading document...');
        const { annotationManager } = instance.Core;

        const loadDoc = async () => {
            try {
                const normalizedPath = template.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
                const encodedPath = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/');
                const baseUrl = getApiUrl().replace(/\/+$/, '');
                const docUrl = `${baseUrl}/${encodedPath}`;

                console.log('🚀 Fetching document for WebViewer:', docUrl);
                setStatus('Downloading template...');

                const response = await fetch(docUrl, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

                const blob = await response.blob();
                console.log('📄 Document blob retrieved, size:', blob.size);

                setStatus('Initializing editor...');

                await instance.UI.loadDocument(blob, {
                    filename: template.name || 'template.docx',
                    extension: 'docx'
                });

                console.log('✅ Document loaded successfully');

                const timer = setTimeout(() => {
                    if (template.canvasData && template.canvasData.startsWith('<?xml')) {
                        try {
                            annotationManager.importAnnotations(template.canvasData);
                            console.log('Annotations imported');
                        } catch (e) {
                            console.error('Annotation import error', e);
                        }
                    }
                }, 500);

                return () => clearTimeout(timer);
            } catch (error) {
                console.error('Document load error:', error);
                setStatus('Error loading document: ' + error.message);
                showAlert('Loading Failed', 'Could not open the document. Please check if the file exists on the server.');
            }
        };

        loadDoc();
    }, [instance, template, isOpen]);

    // Auto-scan on document load
    useEffect(() => {
        if (!instance) return;
        const { documentViewer } = instance.Core;

        const onDocumentLoaded = () => {
            console.log('Document loaded - triggering auto-scan...');
            setTimeout(() => handleScanDocument(true), 800);
        };

        documentViewer.addEventListener('documentLoaded', onDocumentLoaded);
        return () => documentViewer.removeEventListener('documentLoaded', onDocumentLoaded);
    }, [instance]);

    const handleScanDocument = async (silent = false) => {
        if (!instance) return;

        if (!silent) {
            setAiLoading(true);
            setStatus('Scanning for errors...');
        }

        try {
            const { documentViewer, annotationManager, Annotations } = instance.Core;
            const doc = documentViewer.getDocument();
            if (!doc) return;

            const pageCount = doc.getPageCount();

            let fullText = '';
            for (let i = 1; i <= pageCount; i++) {
                const text = await doc.loadPageText(i);
                fullText += text + '\n';
            }

            const response = await fetch(`${getApiUrl()}/api/ai/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ text: fullText, mode: 'scan' })
            });

            const data = await response.json();

            if (data.error) {
                console.error('AI Scan Backend Error:', data);
                if (!silent) showAlert('Scan Error', data.error || 'AI service returned an error', 'error');
                return;
            }

            if (!data.suggestion) {
                console.warn('AI missing suggestion:', data);
                return;
            }

            let suggestions = [];
            try {
                const cleanJson = data.suggestion.replace(/```json|```/g, '').trim();
                suggestions = JSON.parse(cleanJson);
            } catch (jsonErr) {
                console.warn('AI JSON Parse Error:', jsonErr);
                console.log('Original AI Output:', data.suggestion);
                if (!silent) showAlert('AI Error', 'Failed to parse AI response. The data format was unexpected.', 'error');
                return;
            }

            if (suggestions.length === 0) {
                if (!silent) showAlert('Perfect Template!', 'AI scanned the document and found zero grammar or spelling errors.', 'success');
                setStatus('Ready (Verified by AI)');
                return;
            }

            // Clear old AI annotations
            const oldAnnots = annotationManager.getAnnotationsList().filter(a => a.getCustomData('ai_error'));
            annotationManager.deleteAnnotations(oldAnnots);

            let foundCount = 0;
            for (const item of suggestions) {
                await new Promise((resolve) => {
                    documentViewer.clearSearchResults();
                    documentViewer.setSearchListener((result) => {
                        if (result.type === 'found') {
                            const quads = result.quads;
                            const pageNumber = result.pageNum;

                            const squiggly = new Annotations.SquigglyAnnotation();
                            squiggly.PageNumber = pageNumber;
                            squiggly.StrokeColor = new Annotations.Color(255, 0, 0);
                            squiggly.Quads = quads;

                            // Calculate bounding box from quads for better hit detection
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            quads.forEach(q => {
                                minX = Math.min(minX, q.x1, q.x2, q.x3, q.x4);
                                maxX = Math.max(maxX, q.x1, q.x2, q.x3, q.x4);
                                minY = Math.min(minY, q.y1, q.y2, q.y3, q.y4);
                                maxY = Math.max(maxY, q.y1, q.y2, q.y3, q.y4);
                            });
                            squiggly.X = minX;
                            squiggly.Y = minY;
                            squiggly.Width = maxX - minX;
                            squiggly.Height = maxY - minY;

                            squiggly.setCustomData('ai_error', true);
                            squiggly.setCustomData('original', item.original);
                            squiggly.setCustomData('suggestion', item.suggestion);
                            squiggly.setCustomData('reason', item.reason);

                            annotationManager.addAnnotation(squiggly);
                            annotationManager.redrawAnnotation(squiggly);
                            foundCount++;
                        } else if (result.type === 'done') {
                            resolve();
                        }
                    });
                    documentViewer.searchText(item.original, { caseSensitive: false, wholeWord: true });
                });
            }

            setStatus(`Found ${foundCount} items`);
            if (!silent) showAlert('Scan Complete', `AI found ${suggestions.length} potential issues. Hover over red underlines to fix them.`, 'info');

        } catch (err) {
            console.error('Scan Error:', err);
            if (!silent) showAlert('Scan Failed', `Could not complete AI scan: ${err.message}`, 'error');
        } finally {
            if (!silent) setAiLoading(false);
        }
    };

    const handleAISuggest = async (mode, customOverride = '') => {
        if (!instance || !aiToolkit.text) return;

        setAiLoading(true);
        setStatus('AI is thinking...');

        try {
            const response = await fetch(`${getApiUrl()}/api/ai/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    text: aiToolkit.text,
                    mode: mode,
                    customPrompt: customOverride
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!data.suggestion) throw new Error('AI service returned an empty response');

            applyAISuggestion(data.suggestion);

        } catch (err) {
            console.error('AI Suggest Error:', err);
            showAlert('AI Error', `Suggestion failed: ${err.message}`, 'error');
        } finally {
            setAiLoading(false);
            setStatus('Ready');
        }
    };

    const applyAISuggestion = (suggestion) => {
        if (!instance || !suggestion) return;

        try {
            if (instance.UI.typeText) {
                instance.UI.typeText(suggestion);
            } else {
                const { documentViewer } = instance.Core;
                const editTool = documentViewer.getTool('OfficeEditor');
                if (editTool && editTool.pasteText) {
                    editTool.pasteText(suggestion);
                }
            }

            // If correcting an AI error, delete the annotation
            if (aiToolkit.mode === 'correct' && aiToolkit.annot) {
                const { annotationManager } = instance.Core;
                annotationManager.deleteAnnotation(aiToolkit.annot);
            }

            setAiToolkit({ ...aiToolkit, visible: false });
        } catch (err) {
            console.error('Apply suggestion error:', err);
        }
    };

    const addPlaceholder = async (text) => {
        if (!instance) return;
        console.log('Inserting placeholder:', text);

        try {
            if (instance.UI.typeText) {
                instance.UI.typeText(text);
                return;
            }

            const { documentViewer, annotationManager, Annotations } = instance.Core;
            const page = documentViewer.getCurrentPage();

            const txt = new Annotations.FreeTextAnnotation();
            txt.PageNumber = page;
            txt.X = 150;
            txt.Y = 150;
            txt.Width = 200;
            txt.Height = 35;
            txt.Contents = text;
            txt.TextColor = new Annotations.Color(0, 0, 0);
            txt.FontSize = '12pt';
            txt.TextAlign = 'center';

            annotationManager.addAnnotation(txt);
            annotationManager.redrawAnnotation(txt);
            annotationManager.selectAnnotation(txt);

            showAlert('Annotation Added', 'Note: Floating labels might not be detected by the scanner. Try typing the tag directly into the document for best results.');
        } catch (e) {
            console.error('Placeholder insertion error:', e);
        }
    };

    const handleSave = async () => {
        if (!instance) return;

        setStatus('Preparing for save...');

        try {
            const { documentViewer, annotationManager } = instance.Core;

            // Remove AI error annotations before saving
            const aiAnnots = annotationManager.getAnnotationsList().filter(a => a.getCustomData('ai_error'));
            annotationManager.deleteAnnotations(aiAnnots);

            // Exit editing mode
            try {
                if (instance.UI.setToolMode) {
                    instance.UI.setToolMode('Pan');
                }

                if (documentViewer.clearSelection) {
                    documentViewer.clearSelection();
                }

                if (viewerDiv.current) viewerDiv.current.blur();
                window.focus();

            } catch (e) { console.warn('State reset failed:', e); }

            setStatus('Exporting document data...');
            await new Promise(r => setTimeout(r, 500));

            const xfdfString = await annotationManager.exportAnnotations();

            const doc = documentViewer.getDocument();
            if (!doc) throw new Error('Document instance is lost');

            const data = await doc.getFileData({
                downloadType: 'office'
            });

            if (!data || data.byteLength === 0) throw new Error('Exported empty document');

            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            console.log('✅ Export complete, size:', blob.size);
            setStatus('Ready');

            onSave({
                canvasData: xfdfString,
                placeholders: placeholders,
                modifiedDocx: blob
            });

        } catch (error) {
            console.error('Save error:', error);
            setStatus('Error: ' + error.message);
            showAlert('Save Failed', 'The editor encountered an error while exporting. Try clicking "Save" again. Details: ' + error.message, 'error');
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ zIndex: 9999 }}
        >
            <div className={`bg-white w-full h-full max-w-7xl max-h-[95vh] rounded-xl flex shadow-2xl overflow-hidden flex-col transition-transform duration-200 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                {/* Header */}
                <div className="h-16 border-b px-6 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Template Editor (AI-Powered)</h2>
                    <div className="flex gap-3">
                        <span className="text-sm text-gray-500 self-center mr-4">{status}</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                        >
                            Save Template
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* AI Toolkit Popup */}
                    {aiToolkit.visible && (
                        <div
                            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-1 flex items-center gap-1 animate-in fade-in zoom-in duration-200"
                            style={{
                                left: `${aiToolkit.x}px`,
                                top: `${aiToolkit.y}px`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            {aiToolkit.mode === 'suggest' ? (
                                <>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleAISuggest('grammar')}
                                            disabled={aiLoading}
                                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                            Fix Errors
                                        </button>
                                        <button
                                            onClick={() => handleAISuggest('professional')}
                                            disabled={aiLoading}
                                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
                                            Professional
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const pr = prompt("How should AI edit this? (e.g. 'Make it funny', 'Translate to Spanish')");
                                            if (pr) handleAISuggest('custom', pr);
                                        }}
                                        disabled={aiLoading}
                                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"></path><path d="m4 4 3 3"></path><path d="M21 21l-4.5-4.5"></path><path d="M15.7 13.4l-.9-.3"></path><path d="M9.2 16.3l.9.3"></path><circle cx="11.5" cy="11.5" r="3.5"></circle></svg>
                                        Ask AI...
                                    </button>
                                </>
                            ) : (
                                <div className="p-3 max-w-[300px] flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Correction</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-gray-500 italic line-through decoration-red-300">"{aiToolkit.text}"</p>
                                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100">
                                            <p className="text-sm font-bold text-green-700">{aiToolkit.suggestion}</p>
                                            <button
                                                onClick={() => applyAISuggestion(aiToolkit.suggestion)}
                                                className="ml-auto bg-green-600 text-white px-3 py-1 rounded-md text-[10px] uppercase font-bold hover:bg-green-700"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">{aiToolkit.reason}</p>
                                </div>
                            )}

                            {aiLoading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sidebar */}
                    <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto shrink-0">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4 p-3 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
                                <div className="p-1 px-2 border border-white/30 rounded text-[10px] uppercase font-bold tracking-widest">PRO</div>
                                <span className="text-xs font-bold">Template AI Enabled</span>
                            </div>
                            <button
                                onClick={() => handleScanDocument(false)}
                                disabled={aiLoading}
                                className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                                {aiLoading ? 'Scanning...' : 'Scan Template'}
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Placeholders</h3>
                            <p className="text-xs text-gray-400 mb-2">Click to insert</p>
                            <div className="space-y-2">
                                {placeholders.map(ph => (
                                    <button
                                        key={ph}
                                        onClick={() => addPlaceholder(ph)}
                                        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group flex items-center justify-between"
                                    >
                                        <span className="font-mono text-sm text-gray-700 group-hover:text-blue-600">{ph}</span>
                                        <span className="opacity-0 group-hover:opacity-100 text-blue-500 font-bold">+</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative bg-gray-100">
                        <div ref={viewerDiv} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
