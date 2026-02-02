import React from 'react';

const Card = ({ children, className = "", title = "", subtitle = "" }) => {
    return (
        <div className={`card overflow-hidden text-foreground ${className}`}>
            {title && <h3 className="text-2xl font-bold mb-2 tracking-tight font-header">{title}</h3>}
            {subtitle && <p className="text-base text-muted font-medium mb-6 leading-relaxed font-subtitle">{subtitle}</p>}
            {children}
        </div>
    );
};

export default Card;
