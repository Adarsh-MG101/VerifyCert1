"use client";
import { useState, useEffect } from 'react';

export default function TemplatesPage() {
    const [file, setFile] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTemplates = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/templates', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => setTemplates(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                setFile(null);
                fetchTemplates();
            } else {
                alert('Upload failed');
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this template?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchTemplates();
            } else {
                alert('Delete failed');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Templates</h1>

            <div className="card mb-8">
                <h2 className="text-xl font-bold mb-4">Upload New Template</h2>
                <form onSubmit={handleUpload} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-gray-400 mb-2">Select Word (.docx) File</label>
                        <input
                            type="file"
                            accept=".docx"
                            className="input"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>
                    <button type="submit" disabled={!file || loading} className="btn mb-4">
                        {loading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>

            <h2 className="text-xl font-bold mb-4">Existing Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(t => (
                    <div key={t._id} className="card">
                        <h3 className="font-bold text-lg mb-2">{t.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">ID: {t._id}</p>
                        <div className="mb-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Placeholders:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {t.placeholders.map(p => (
                                    <span key={p} className="bg-slate-800 text-xs px-2 py-1 rounded text-blue-300">{p}</span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(t._id)}
                            className="btn-outline text-red-400 border-red-400 hover:bg-red-900 w-full text-sm"
                        >
                            Delete
                        </button>
                    </div>
                ))}
                {templates.length === 0 && <p className="text-gray-500">No templates found.</p>}
            </div>
        </div>
    );
}
