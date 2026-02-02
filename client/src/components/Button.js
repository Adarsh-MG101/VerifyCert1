import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled, ...props }) => {
    const baseStyles = "px-5 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-primary text-white shadow-xl shadow-primary/10 hover:brightness-110",
        outline: "bg-transparent border border-primary text-primary hover:bg-primary/5 shadow-lg shadow-primary/5",
        ghost: "bg-transparent hover:bg-gray-100 border-none text-foreground",
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
