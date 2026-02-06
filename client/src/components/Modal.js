import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, subtitle, children, className = "" }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    // We use createPortal to render the modal at the root of the document body.
    // This bypasses any CSS transforms or z-index issues in parent layouts.
    return createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 z-9999 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop - darker and more blurred for focus */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl p-8 animate-fade-in ${className}`}>
                {title && (
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight font-header">{title}</h3>
                        {subtitle && <p className="text-sm text-muted mt-1 font-subtitle uppercase tracking-widest opacity-70">{subtitle}</p>}
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
