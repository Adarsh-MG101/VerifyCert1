import React from 'react';

const Input = ({ label, type = "text", className = "", ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}
            <input
                type={type}
                className={`input ${props.className || ""}`}
                {...props}
            />

        </div>
    );
};

export default Input;
