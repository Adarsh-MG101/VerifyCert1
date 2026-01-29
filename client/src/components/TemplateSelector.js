"use client";

const TemplateSelector = ({ templates, selectedTemplate, onTemplateSelect, label = "Choose Template", className = "mb-8" }) => {
    // Handle both object and ID string formats for the selection
    const selectedId = typeof selectedTemplate === 'object' ? selectedTemplate?._id : selectedTemplate;

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
                {label}
            </label>
            <select
                className="input bg-white/5 border-glass-border focus:border-primary transition-all cursor-pointer h-[46px]"
                onChange={onTemplateSelect}
                value={selectedId || ""}
            >
                <option value="" className="bg-slate-900 text-white">-- {label} --</option>
                {Array.isArray(templates) && templates.map(t => (
                    <option key={t._id} value={t._id} className="bg-slate-900 text-white">
                        {t.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TemplateSelector;
