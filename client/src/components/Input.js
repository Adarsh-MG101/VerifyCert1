import React from 'react';

const Input = ({ label, type = "text", className = "", compact = false, ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className={`block font-bold text-gray-500 uppercase tracking-widest ${compact ? 'text-[9px] mb-1' : 'text-sm mb-2'}`}>
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
