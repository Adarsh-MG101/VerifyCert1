import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled, ...props }) => {
    const baseStyles = "btn";
    const variants = {
        primary: "",
        outline: "btn-outline",
        ghost: "bg-transparent hover:bg-white/5 border-none",
        danger: "bg-red-500 hover:bg-red-600 border-none",
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
