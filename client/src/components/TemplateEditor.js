import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import WebViewer from '@pdftron/webviewer';
import { getApiUrl } from '../services/apiService';

export default function TemplateEditor({ template, isOpen, onSave, onClose }) {
    const viewerDiv = useRef(null);
    const [instance, setInstance] = useState(null);
    const [status, setStatus] = useState('Initializing...');

    // Use default placeholders if none defined
    const placeholders = template && template.placeholders && template.placeholders.length > 0
        ? template.placeholders
        : ['{{NAME}}', '{{DATE}}', '{{COURSE}}', '{{ID}}'];

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

            const { documentViewer } = inst.Core;

            documentViewer.addEventListener('documentLoaded', () => {
                console.log('Document loaded');
                setStatus('Ready');
                inst.UI.setFitMode(inst.UI.FitMode.FitPage);
            });

            documentViewer.addEventListener('loadError', (err) => {
                console.error('Load Error:', err);
                setStatus('Error: ' + err.message);
            });
        });
    }, []); // Empty deps = run once

    // Load document when template changes and modal is open
    useEffect(() => {
        console.log('Load effect triggered:', { instance: !!instance, template: !!template, isOpen });

        if (!instance || !template || !isOpen) {
            console.log('Skipping load - missing:', { instance: !instance, template: !template, isOpen: !isOpen });
            return;
        }

        setStatus('Loading document...');
        const { annotationManager } = instance.Core;

        // Clean path and encode
        const cleanPath = template.filePath.replace(/\\/g, '/').split('/').map(part => encodeURIComponent(part)).join('/');
        const docUrl = `${getApiUrl()}/${cleanPath}`;

        console.log('Loading document:', docUrl);
        instance.UI.loadDocument(docUrl, { filename: template.name || 'template.docx' });

        // Load annotations after a brief delay to ensure document is ready
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
    }, [instance, template, isOpen]); // Re-run when these change

    const addPlaceholder = (text) => {
        if (!instance) return;
        const { documentViewer, annotationManager, Annotations } = instance.Core;
        const page = documentViewer.getCurrentPage();

        const txt = new Annotations.FreeTextAnnotation();
        txt.PageNumber = page;
        txt.X = 100; // Default position
        txt.Y = 100;
        txt.Width = 200;
        txt.Height = 50;
        txt.setPadding(new Annotations.Rect(0, 0, 0, 0));
        txt.Contents = text;
        txt.FillColor = new Annotations.Color(255, 255, 255, 0); // Transparent
        txt.TextColor = new Annotations.Color(0, 0, 0);
        txt.FontSize = '12pt';
        txt.TextAlign = 'center';

        annotationManager.addAnnotation(txt);
        annotationManager.redrawAnnotation(txt);
        annotationManager.selectAnnotation(txt);
    };

    const handleSave = async () => {
        if (!instance) return;
        const { annotationManager } = instance.Core;

        // Export annotations as XFDF
        const xfdfString = await annotationManager.exportAnnotations();

        onSave({
            canvasData: xfdfString,
            placeholders: placeholders
        });
    };

    // Portal to document.body
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ zIndex: 9999 }}
        >
            <div className={`bg-white w-full h-full max-w-7xl max-h-[95vh] rounded-xl flex shadow-2xl overflow-hidden flex-col transition-transform duration-200 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                {/* Header */}
                <div className="h-16 border-b px-6 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Template Editor (Apryse)</h2>
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
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto shrink-0">
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
