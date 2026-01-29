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
                className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content - Solid Style */}
            <div className={`relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in ${className}`}>
                {title && (
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
                        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
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
