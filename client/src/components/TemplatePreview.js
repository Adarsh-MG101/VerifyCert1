"use client";

const TemplatePreview = ({ template, className = "", maxWidth = "300px", showLabel = true, overlayText = "" }) => {
    if (!template) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    return (
        <div className={`animate-fade-in group ${className}`}>
            {showLabel && (
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Template Preview
                </span>
            )}
            <div
                className="relative aspect-[1.414/1] w-full bg-slate-800/50 rounded-xl overflow-hidden border border-glass-border group-hover:border-primary/30 transition-all shadow-xl"
                style={{ maxWidth }}
            >
                {template.thumbnailPath ? (
                    <img
                        src={`${API_URL}/${template.thumbnailPath}`}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                        <span className="text-3xl mb-1">📄</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">No Preview</span>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                    <p className="text-xs text-white/90 font-medium line-clamp-1">{template.name}</p>
                    {overlayText && (
                        <p className="text-[10px] text-white/50 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {overlayText}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplatePreview;
