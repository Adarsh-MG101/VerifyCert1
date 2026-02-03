import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, subtitle, children, className = "" }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content - Solid Style */}
            <div className={`relative w-full max-w-md bg-card border border-border rounded-xl shadow-card p-8 animate-fade-in ${className}`}>
                {title && (
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight font-header">{title}</h3>
                        {subtitle && <p className="text-sm text-muted mt-1 font-subtitle">{subtitle}</p>}
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {children}
            </div>
        </div>
    );
};

export default Modal;
