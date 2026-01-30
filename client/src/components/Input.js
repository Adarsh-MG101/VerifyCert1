import React from 'react';

const Input = ({ label, type = "text", className = "", compact = false, ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className={`block font-bold text-gray-400 uppercase tracking-widest ${compact ? 'text-[10px] mb-1.5' : 'text-xs mb-2.5'}`}>
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`input ${compact ? 'p-2! text-sm h-[38px]' : ''} ${props.className || ""}`}
                {...props}
            />
        </div>
    );
};

export default Input;
