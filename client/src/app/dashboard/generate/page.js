"use client";
import { useState, useEffect } from 'react';

export default function GeneratePage() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [certificateTitle, setCertificateTitle] = useState('Certificate of Completion');
    const [generatedDoc, setGeneratedDoc] = useState(null);
    const [generating, setGenerating] = useState(false);

    // New state for QR Code coordinates
    const [qrX, setQrX] = useState(50);
    const [qrY, setQrY] = useState(50);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/templates', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data)) {
                    setTemplates(data);
                } else {
                    console.error('Expected array of templates, got:', data);
                    setTemplates([]);
                }
            })
            .catch(err => {
                console.error('Error fetching templates:', err);
                setTemplates([]);
            });
    }, []);

    const handleTemplateSelect = (e) => {
        const tId = e.target.value;
        const t = templates.find(x => x._id === tId);
        setSelectedTemplate(t);
        setFormData({});
        setGeneratedDoc(null);
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        const token = localStorage.getItem('token');
        setGenerating(true);
        try {
            const res = await fetch('http://localhost:5000/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    templateId: selectedTemplate._id,
                    data: formData,
                    qrX: qrX, // Send X coordinate
                    qrY: qrY  // Send Y coordinate
                })
            });
            const result = await res.json();
            if (res.ok) {
                setGeneratedDoc(result);
            } else {
                alert(result.error || 'Generation Failed');
            }
        } catch (err) {
            console.error(err);
        }
        setGenerating(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Generate Document</h1>

            <div className="card max-w-2xl">
                <div className="mb-6">
                    <label className="block text-gray-400 mb-2">Select Template</label>
                    <select className="input bg-slate-800" onChange={handleTemplateSelect}>
                        <option value="">-- Choose Template --</option>
                        {Array.isArray(templates) && templates.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {selectedTemplate && (
                    <form onSubmit={handleGenerate}>
                        <h3 className="font-semibold mb-4 border-b border-gray-700 pb-2">Fill Template Variables</h3>
                        <div className="space-y-4 mb-6">
                            {selectedTemplate.placeholders && selectedTemplate.placeholders.filter(p => p !== 'certificate_id').length > 0 ? (
                                selectedTemplate.placeholders
                                    .filter(p => p !== 'certificate_id')
                                    .map(key => (
                                        <div key={key}>
                                            <label className="block text-sm text-gray-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
                                            <input
                                                type="text"
                                                className="input mb-0"
                                                placeholder={`Enter ${key}`}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                required
                                            />
                                        </div>
                                    ))
                            ) : (
                                <p className="text-gray-500 italic pb-4">No placeholders found in this template.</p>
                            )}

                            {/* QR Code Location Inputs */}
                            <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4 mt-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">QR Code X Position</label>
                                    <input
                                        type="number"
                                        className="input mb-0"
                                        value={qrX}
                                        onChange={(e) => setQrX(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">QR Code Y Position</label>
                                    <input
                                        type="number"
                                        className="input mb-0"
                                        value={qrY}
                                        onChange={(e) => setQrY(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                        </div>
                        <button type="submit" className="btn w-full" disabled={generating}>
                            {generating ? 'Generating PDF...' : 'Generate PDF'}
                        </button>
                    </form>
                )}
            </div>

            {
                generatedDoc && (
                    <div className="mt-8 p-6 bg-green-900/20 border border-green-500/50 rounded-xl animate-fade-in">
                        <h3 className="text-green-400 font-bold text-xl mb-2">Document Generated!</h3>
                        <p className="mb-4">ID: <span className="font-mono bg-black/30 px-2 py-1 rounded">{generatedDoc.document.uniqueId}</span></p>

                        <div className="flex gap-4">
                            <a href={`http://localhost:5000${generatedDoc.downloadUrl}`} target="_blank" className="btn bg-green-600">Download PDF</a>
                            <a href={`/verify/${generatedDoc.document.uniqueId}`} target="_blank" className="btn btn-outline">Verify Link</a>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
