import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled, ...props }) => {
    const baseStyles = "btn flex items-center justify-center";
    const variants = {
        primary: "bg-primary-gradient border-none text-white shadow-xl shadow-primary/10",
        outline: "btn-outline border border-primary text-primary hover:bg-primary/10 shadow-lg shadow-primary/5",
        ghost: "bg-transparent hover:bg-white/5 border-none text-white",
        danger: "bg-red-600 hover:bg-red-700 border-none text-white shadow-lg shadow-red-900/10",
    };

    const disabledStyles = "opacity-70 cursor-not-allowed pointer-events-none transform-none shadow-none";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${disabled ? disabledStyles : ''} ${className} will-change-transform`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
