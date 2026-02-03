"use client";
import React from 'react';

const Guidelines = ({ title, icon, items = [], children, className = "" }) => {
    return (
        <div className={`mb-10 p-8 bg-primary/5 border border-primary/20 rounded-xl space-y-4 animate-fade-in ${className}`}>
            <h4 className="text-xl font-bold text-primary flex items-center uppercase tracking-wider">
                <span className="mr-3 text-2xl">{icon}</span> {title}
            </h4>

            {items.length > 0 ? (
                <ul className="text-sm text-foreground/80 space-y-4 ml-6 list-disc marker:text-primary leading-relaxed font-normal">
                    {items.map((item, index) => (
                        <li key={index} className="pl-2">
                            {item}
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-sm text-foreground/80 leading-relaxed font-normal">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Guidelines;
