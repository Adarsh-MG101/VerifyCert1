import React from 'react';

const DisplayField = ({ label, value, className = "", variant = "default", icon, extra, subtext }) => {
    const variants = {
        default: "bg-gray-50 border-border text-foreground font-medium",
        primary: "bg-primary/10 border-primary/20 text-primary font-bold font-mono",
        muted: "bg-gray-50 border-border text-muted font-medium select-none"
    };

    return (
        <div className={`flex flex-col space-y-2 w-full ${className}`}>
            {label && (
                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] flex items-center gap-2">
                    {icon && <span>{icon}</span>}
                    {label}
                </label>
            )}
            <div className={`px-4 py-3 border rounded-xl flex items-center justify-between transition-all ${variants[variant] || variants.default}`}>
                <div className="flex-1 truncate">
                    {value || <span className="text-gray-300 italic">Not set</span>}
                </div>
                {extra && <div className="ml-3 shrink-0">{extra}</div>}
            </div>
            {subtext && <p className="text-[10px] text-muted mt-1 italic leading-tight">{subtext}</p>}
        </div>
    );
};

export default DisplayField;
