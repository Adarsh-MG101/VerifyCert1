"use client";

const TemplatePreview = ({ template, className = "", maxWidth = "300px", showLabel = true, overlayText = "" }) => {
    if (!template) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    return (
        <div className={`animate-fade-in group ${className}`}>
            {showLabel && (
                <span className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
                    Template Preview
                </span>
            )}
            <div
                className="relative aspect-[1.414/1] w-full bg-gray-50 rounded-xl overflow-hidden border border-border group-hover:border-primary/30 transition-all shadow-card"
                style={{ maxWidth }}
            >
                {template.thumbnailPath ? (
                    <img
                        src={`${API_URL}/${template.thumbnailPath}`}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                        <span className="text-3xl mb-1">📄</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest">No Preview</span>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-gray-900/60 via-gray-900/20 to-transparent p-3 pt-8">
                    <p className="text-xs text-white font-medium line-clamp-1">{template.name}</p>
                    {overlayText && (
                        <p className="text-[10px] text-white/70 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {overlayText}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplatePreview;
