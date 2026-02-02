import React from 'react';

const Input = ({ label, type = "text", containerClassName = "", compact = false, className = "", ...props }) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className={`block font-bold text-muted uppercase tracking-widest ${compact ? 'text-[10px] mb-1.5' : 'text-xs mb-2.5'}`}>
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`w-full p-2.5 rounded-lg bg-white border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium ${compact ? 'py-2 px-3 text-sm h-[38px]' : 'h-[46px]'} ${className}`}
                {...props}
            />
        </div>
    );
};

export default Input;
