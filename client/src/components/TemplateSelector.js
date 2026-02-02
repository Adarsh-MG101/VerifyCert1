"use client";

const TemplateSelector = ({ templates, selectedTemplate, onTemplateSelect, label = "Choose Template", className = "mb-8", compact = false }) => {
    // Handle both object and ID string formats for the selection
    const selectedId = typeof selectedTemplate === 'object' ? selectedTemplate?._id : selectedTemplate;

    return (
        <div className={className}>
            <label className={`block font-bold text-muted uppercase tracking-widest ${compact ? 'text-[10px] mb-1.5' : 'text-xs mb-3'}`}>
                {label}
            </label>
            <select
                className={`input bg-white border-border focus:border-primary transition-all cursor-pointer ${compact ? 'p-2! text-sm h-[38px]' : 'h-[46px]'}`}
                onChange={onTemplateSelect}
                value={selectedId || ""}
            >
                <option value="" className="bg-white text-gray-400 text-sm">-- {label} --</option>
                {Array.isArray(templates) && templates.map(t => (
                    <option key={t._id} value={t._id} className="bg-white text-gray-400 text-sm">
                        {t.name.replace(/\.[^/.]+$/, "")}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TemplateSelector;
