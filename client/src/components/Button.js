import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", ...props }) => {
    const baseStyles = "btn";
    const variants = {
        primary: "",
        outline: "btn-outline",
        ghost: "bg-transparent hover:bg-white/5 border-none",
        danger: "bg-red-500 hover:bg-red-600 border-none",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
