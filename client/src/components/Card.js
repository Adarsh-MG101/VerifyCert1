import React from 'react';

const Card = ({ children, className = "", title = "", subtitle = "" }) => {
    return (
        <div className={`card ${className}`}>
            {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-400 mb-4">{subtitle}</p>}
            {children}
        </div>
    );
};

export default Card;
