import React from 'react';

const Card = ({ children, className = "", title = "", subtitle = "" }) => {
    return (
        <div className={`card overflow-hidden ${className}`}>
            {title && <h3 className="text-2xl font-bold mb-2 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-base text-gray-400 font-medium mb-6 leading-relaxed opacity-80">{subtitle}</p>}
            {children}
        </div>
    );
};

export default Card;
