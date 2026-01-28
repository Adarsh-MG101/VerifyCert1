"use client";

const TemplateSelector = ({ templates, selectedTemplate, onTemplateSelect, label = "Choose Template" }) => {
    return (
        <div className="mb-8">
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
                {label}
            </label>
            <select
                className="input bg-white/5 border-glass-border focus:border-primary transition-all cursor-pointer"
                onChange={onTemplateSelect}
                value={selectedTemplate?._id || ""}
            >
                <option value="" className="bg-slate-900">-- Choose Template --</option>
                {Array.isArray(templates) && templates.map(t => (
                    <option key={t._id} value={t._id} className="bg-slate-900">
                        {t.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TemplateSelector;
