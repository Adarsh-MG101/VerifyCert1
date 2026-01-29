import React from 'react';

const ValidationError = ({ message }) => {
    if (!message) return null;

    return (
        <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12" height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
            >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                {message}
            </span>
        </div>
    );
};

export default ValidationError;
