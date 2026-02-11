import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getApiUrl } from '../services/apiService';
import { useWebViewer } from '../context/WebViewerContext';

export default function TemplateEditor({ template, isOpen, onSave, onClose }) {
    const viewerAnchor = useRef(null);
    const { instance, isReady, showViewer, hideViewer } = useWebViewer();

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
        alert(`${title}\n\n${message}`);
    };

    // --- RE-POSITIONING LOGIC ---
    const updateViewerPosition = useCallback(() => {
        if (isOpen && viewerAnchor.current) {
            const rect = viewerAnchor.current.getBoundingClientRect();
            showViewer(rect);
        }
    }, [isOpen, showViewer]);

    // Handle position initialization and window resizing
    useEffect(() => {
        let timer;
        if (isOpen) {
            updateViewerPosition();
            window.addEventListener('resize', updateViewerPosition);

            // Re-check after a short delay for modal animations
            timer = setTimeout(updateViewerPosition, 400);
        } else {
            hideViewer();
        }

        return () => {
            window.removeEventListener('resize', updateViewerPosition);
            if (timer) clearTimeout(timer);
            // Only hide if we are unmounting or closing
            if (!isOpen) hideViewer();
        };
    }, [isOpen, updateViewerPosition, hideViewer]);

    // --- LISTENERS SETUP ---
    useEffect(() => {
        if (!instance || !isOpen) return;

        const { documentViewer, annotationManager } = instance.Core;

        const onTextSelected = (quads, text, pageNumber) => {
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
                } catch (e) { }
            }
        };

        const onAnnotSelected = (annotations) => {
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
        };

        let currentHoveredAnnotId = null;
        const onMouseMove = (e) => {
            const annots = annotationManager.getAnnotationsList();
            const aiErrors = annots.filter(a => a.getCustomData('ai_error'));
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
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    setHoverTimeout(null);
                }
                if (hoveredAnnot) {
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
        };

        const onLoadError = (err) => {
            console.error('Document load error:', err);
            setStatus('Error: ' + err.message);
        };

        documentViewer.addEventListener('textSelected', onTextSelected);
        annotationManager.addEventListener('annotationSelected', onAnnotSelected);
        documentViewer.addEventListener('loadError', onLoadError);

        // Use a wrapper to find the actual viewer element for mouse events
        const viewerElement = document.getElementById('persistent-webviewer');
        if (viewerElement) viewerElement.addEventListener('mousemove', onMouseMove);

        return () => {
            documentViewer.removeEventListener('textSelected', onTextSelected);
            annotationManager.removeEventListener('annotationSelected', onAnnotSelected);
            documentViewer.removeEventListener('loadError', onLoadError);
            if (viewerElement) viewerElement.removeEventListener('mousemove', onMouseMove);
        };
    }, [instance, isOpen, hoverTimeout]);

    // --- DOCUMENT LOADING ---
    useEffect(() => {
        if (!instance || !template || !isOpen) return;

        setStatus('Loading document...');
        const { annotationManager } = instance.Core;

        const loadDoc = async () => {
            try {
                const normalizedPath = template.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
                const encodedPath = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/');
                const baseUrl = getApiUrl().replace(/\/+$/, '');
                const docUrl = `${baseUrl}/${encodedPath}`;

                console.log('🚀 Loading document from dashboard context:', docUrl);
                setStatus('Downloading template...');

                const response = await fetch(docUrl, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const blob = await response.blob();

                setStatus('Updating Editor...');
                await instance.UI.loadDocument(blob, {
                    filename: template.name || 'template.docx',
                    extension: 'docx'
                });

                console.log('✅ Shared WebViewer document loaded');
                setStatus('Ready');

                setTimeout(() => {
                    if (template.canvasData && template.canvasData.startsWith('<?xml')) {
                        try {
                            annotationManager.importAnnotations(template.canvasData);
                        } catch (e) {
                            console.error('Annotation import error', e);
                        }
                    }
                }, 500);
            } catch (error) {
                console.error('Shared Load error:', error);
                setStatus('Error: ' + error.message);
            }
        };

        loadDoc();
    }, [instance, template, isOpen]);

    // --- AI ACTIONS ---
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
            if (data.error || !data.suggestion) throw new Error(data.error || 'AI Missing Data');

            const cleanJson = data.suggestion.replace(/```json|```/g, '').trim();
            const suggestions = JSON.parse(cleanJson);

            if (suggestions.length === 0) {
                if (!silent) showAlert('Perfect!', 'No errors found!');
                setStatus('Ready (Verified)');
                return;
            }

            const oldAnnots = annotationManager.getAnnotationsList().filter(a => a.getCustomData('ai_error'));
            annotationManager.deleteAnnotations(oldAnnots);

            for (const item of suggestions) {
                await new Promise((resolve) => {
                    documentViewer.clearSearchResults();
                    documentViewer.setSearchListener((result) => {
                        if (result.type === 'found') {
                            const quads = result.quads;
                            const squiggly = new Annotations.SquigglyAnnotation();
                            squiggly.PageNumber = result.pageNum;
                            squiggly.StrokeColor = new Annotations.Color(255, 0, 0);
                            squiggly.Quads = quads;

                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            quads.forEach(q => {
                                minX = Math.min(minX, q.x1, q.x2, q.x3, q.x4);
                                maxX = Math.max(maxX, q.x1, q.x2, q.x3, q.x4);
                                minY = Math.min(minY, q.y1, q.y2, q.y3, q.y4);
                                maxY = Math.max(maxY, q.y1, q.y2, q.y3, q.y4);
                            });
                            squiggly.X = minX; squiggly.Y = minY; squiggly.Width = maxX - minX; squiggly.Height = maxY - minY;

                            squiggly.setCustomData('ai_error', true);
                            squiggly.setCustomData('original', item.original);
                            squiggly.setCustomData('suggestion', item.suggestion);
                            squiggly.setCustomData('reason', item.reason);
                            annotationManager.addAnnotation(squiggly);
                            annotationManager.redrawAnnotation(squiggly);
                        } else if (result.type === 'done') resolve();
                    });
                    documentViewer.searchText(item.original, { caseSensitive: false, wholeWord: true });
                });
            }
            setStatus(`Scan Complete`);
        } catch (err) {
            console.error('Scan error:', err);
        } finally {
            if (!silent) setAiLoading(false);
        }
    };

    const handleAISuggest = async (mode, customOverride = '') => {
        if (!instance || !aiToolkit.text) return;
        setAiLoading(true);
        setStatus('AI thinking...');
        try {
            const response = await fetch(`${getApiUrl()}/api/ai/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ text: aiToolkit.text, mode, customPrompt: customOverride })
            });
            const data = await response.json();
            if (data.error || !data.suggestion) throw new Error(data.error || 'Empty');
            applyAISuggestion(data.suggestion);
        } catch (err) {
            showAlert('AI Error', err.message);
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
                const editTool = instance.Core.documentViewer.getTool('OfficeEditor');
                if (editTool?.pasteText) editTool.pasteText(suggestion);
            }
            if (aiToolkit.mode === 'correct' && aiToolkit.annot) {
                instance.Core.annotationManager.deleteAnnotation(aiToolkit.annot);
            }
            setAiToolkit({ ...aiToolkit, visible: false });
        } catch (err) { console.error(err); }
    };

    const addPlaceholder = async (text) => {
        if (!instance) return;
        try {
            if (instance.UI.typeText) {
                instance.UI.typeText(text);
                return;
            }
            const { documentViewer, annotationManager, Annotations } = instance.Core;
            const page = documentViewer.getCurrentPage();
            const txt = new Annotations.FreeTextAnnotation();
            txt.PageNumber = page; txt.X = 150; txt.Y = 150; txt.Width = 200; txt.Height = 35;
            txt.Contents = text; txt.TextColor = new Annotations.Color(0, 0, 0);
            txt.FontSize = '12pt'; txt.TextAlign = 'center';
            annotationManager.addAnnotation(txt);
            annotationManager.redrawAnnotation(txt);
            annotationManager.selectAnnotation(txt);
        } catch (e) { }
    };

    const handleSave = async () => {
        if (!instance) return;
        setStatus('Saving...');
        try {
            const { documentViewer, annotationManager } = instance.Core;
            const aiAnnots = annotationManager.getAnnotationsList().filter(a => a.getCustomData('ai_error'));
            annotationManager.deleteAnnotations(aiAnnots);

            const xfdfString = await annotationManager.exportAnnotations();
            const doc = documentViewer.getDocument();
            const data = await doc.getFileData({ downloadType: 'office' });
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            onSave({ canvasData: xfdfString, placeholders, modifiedDocx: blob });
            setStatus('Ready');
        } catch (error) {
            setStatus('Error: ' + error.message);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ zIndex: 9999 }}
            >
                <div className={`bg-white w-full h-full max-w-7xl max-h-[95vh] rounded-xl flex shadow-2xl overflow-hidden flex-col transition-transform duration-200 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                    {/* Header */}
                    <div className="h-16 border-b px-6 flex items-center justify-between bg-white shrink-0">
                        <h2 className="text-xl font-bold text-gray-800">Template Editor (Fast-Load Shared Engine)</h2>
                        <div className="flex gap-3">
                            {!isReady && <div className="text-orange-500 text-sm font-bold flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                Engine Initializing...
                            </div>}
                            <span className="text-sm text-gray-500 self-center mr-4">{status}</span>
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Template</button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto shrink-0">
                            <button
                                onClick={() => handleScanDocument(false)}
                                disabled={aiLoading || !isReady}
                                className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-bold text-sm shadow-lg disabled:opacity-50"
                            >
                                {aiLoading ? 'Scanning...' : 'Scan Template'}
                            </button>
                            <div className="mt-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Placeholders</h3>
                                <div className="space-y-2">
                                    {placeholders.map(ph => (
                                        <button key={ph} onClick={() => addPlaceholder(ph)} className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 font-mono text-xs">{ph}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div ref={viewerAnchor} className="flex-1 bg-gray-200 relative overflow-hidden">
                            {!isReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-500 font-medium">Initializing Apryse Engine...</p>
                                </div>
                            )}
                            {isReady && status === 'Downloading template...' && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-xl border border-gray-100">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm font-bold text-gray-700">Loading "{template?.name}"...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Toolkit Layer - Directly in portal sibling to modal, with highest Z-index */}
            {aiToolkit.visible && isOpen && (
                <div
                    className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl p-1 flex items-center gap-1 animate-in fade-in zoom-in duration-200"
                    style={{
                        left: `${aiToolkit.x}px`,
                        top: `${aiToolkit.y - 12}px`, // Adjusted for mouse pointer
                        transform: 'translateX(-50%) translateY(-100%)',
                        zIndex: 11000 // Above persistent viewer (10000)
                    }}
                >
                    {aiToolkit.mode === 'suggest' ? (
                        <>
                            <button onClick={() => handleAISuggest('grammar')} className="p-2 hover:bg-gray-100 text-xs font-bold flex items-center gap-1 transition-colors rounded-lg">Fix Errors</button>
                            <button onClick={() => handleAISuggest('professional')} className="p-2 hover:bg-gray-100 text-xs font-bold flex items-center gap-1 transition-colors rounded-lg">Professional</button>
                            <button onClick={() => {
                                const pr = prompt("How should AI edit this?");
                                if (pr) handleAISuggest('custom', pr);
                            }} className="p-2 hover:bg-gray-100 text-xs font-bold flex items-center gap-1 transition-colors rounded-lg">Ask AI...</button>
                        </>
                    ) : (
                        <div className="p-3 max-w-[300px] flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Correction</span>
                            <p className="text-xs text-gray-500 italic line-through decoration-red-300">"{aiToolkit.text}"</p>
                            <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100">
                                <p className="text-sm font-bold text-green-700">{aiToolkit.suggestion}</p>
                                <button onClick={() => applyAISuggestion(aiToolkit.suggestion)} className="ml-auto bg-green-600 text-white px-3 py-1 rounded-md text-[10px] font-bold">Apply</button>
                            </div>
                            <p className="text-[10px] text-gray-400">{aiToolkit.reason}</p>
                        </div>
                    )}
                </div>
            )}
        </>,
        document.body
    );
}
