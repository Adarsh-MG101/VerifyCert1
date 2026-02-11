"use client";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WebViewerContext = createContext(null);

export function WebViewerProvider({ children }) {
    const [instance, setInstance] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [viewerConfig, setViewerConfig] = useState({
        visible: false,
        top: '-10000px',
        left: '-10000px',
        width: '0px',
        height: '0px',
        zIndex: -1
    });
    const viewerDiv = useRef(null);
    const initializationRef = useRef(false);

    useEffect(() => {
        // Initialize Apryse WebViewer only on the client
        if (typeof window === 'undefined' || initializationRef.current) return;
        initializationRef.current = true;

        const initWebViewer = async () => {
            try {
                // Dynamically import WebViewer to avoid SSR window issues
                const WebViewer = (await import('@pdftron/webviewer')).default;

                console.log('🚀 Pre-loading Apryse WebViewer SDK...');

                WebViewer({
                    path: '/webviewer',
                    fullAPI: true,
                    enableOfficeEditing: true,
                }, viewerDiv.current).then(inst => {
                    setInstance(inst);
                    setIsReady(true);
                    console.log('✅ Apryse SDK initialized and ready');
                    inst.UI.setFitMode(inst.UI.FitMode.FitPage);
                });
            } catch (err) {
                console.error('WebViewer Initialization Error:', err);
            }
        };

        initWebViewer();
    }, []);

    const showViewer = useCallback((rect) => {
        setViewerConfig(prev => {
            // Avoid unnecessary state updates if values are the same
            if (prev.visible &&
                prev.top === `${rect.top}px` &&
                prev.left === `${rect.left}px` &&
                prev.width === `${rect.width}px` &&
                prev.height === `${rect.height}px`) {
                return prev;
            }
            return {
                visible: true,
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                zIndex: 10000 // Above modal (9999)
            };
        });
    }, []);

    const hideViewer = useCallback(() => {
        setViewerConfig(prev => {
            if (!prev.visible) return prev;
            return {
                ...prev,
                visible: false,
                top: '-10000px',
                left: '-10000px',
                zIndex: -1
            };
        });
    }, []);

    return (
        <WebViewerContext.Provider value={{ instance, isReady, viewerDiv, showViewer, hideViewer }}>
            {children}
            <div
                ref={viewerDiv}
                id="persistent-webviewer"
                style={{
                    position: 'fixed',
                    top: viewerConfig.top,
                    left: viewerConfig.left,
                    width: viewerConfig.width,
                    height: viewerConfig.height,
                    zIndex: viewerConfig.zIndex,
                    visibility: viewerConfig.visible ? 'visible' : 'hidden',
                    opacity: viewerConfig.visible ? 1 : 0,
                    pointerEvents: viewerConfig.visible ? 'auto' : 'none',
                    background: 'white',
                    transition: 'opacity 0.15s ease-out'
                }}
            />
        </WebViewerContext.Provider>
    );
}

export const useWebViewer = () => {
    const context = useContext(WebViewerContext);
    if (!context) {
        throw new Error('useWebViewer must be used within a WebViewerProvider');
    }
    return context;
};
