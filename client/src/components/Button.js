import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled, ...props }) => {
    const baseStyles = "btn flex items-center justify-center";
    const variants = {
        primary: "bg-linear-to-r from-primary to-accent border-none text-white",
        outline: "btn-outline border border-primary text-primary hover:bg-primary/10",
        ghost: "bg-transparent hover:bg-white/5 border-none text-white",
        danger: "bg-red-600 hover:bg-red-700 border-none text-white",
    };

    const disabledStyles = "opacity-50 grayscale cursor-not-allowed pointer-events-none transform-none shadow-none";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${disabled ? disabledStyles : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
