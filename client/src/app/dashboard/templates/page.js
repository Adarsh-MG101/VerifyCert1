"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function TemplatesPage() {
    const [file, setFile] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showBuffer, setShowBuffer] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchTemplates = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_URL}/api/templates`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                return res.ok ? res.json() : [];
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setTemplates(data);
                } else if (data) {
                    console.error('Expected array of templates, got:', data);
                    setTemplates([]);
                }
            })
            .catch(err => {
                console.error('Error fetching templates:', err);
                setTemplates([]);
            });
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
            const res = await fetch(`${API_URL}/api/templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                setFile(null);
                // Clear the form visually
                e.target.reset();

                // Show buffer for 1 second as requested
                setShowBuffer(true);
                setTimeout(() => {
                    setShowBuffer(false);
                    fetchTemplates();
                }, 1000);
            } else {
                const data = await res.json();
                alert(data.error || 'Upload failed');
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
            const res = await fetch(`${API_URL}/api/templates/${id}`, {
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
        <div className="animate-fade-in max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Certificate Templates</h1>

            <Card
                title="Upload New Template"
                subtitle="Upload a Word (.docx) file with {{placeholders}} to create a new template"
                className="mb-10"
            >
                {loading || showBuffer ? (
                    <div className="flex flex-col items-center justify-center py-8 animate-pulse text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-primary/20"></div>
                        <p className="text-primary font-medium">
                            {loading ? 'Uploading & Analyzing Template...' : 'Finalizing structure...'}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-end mt-4">
                        <div className="flex-1 w-full">
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".docx"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`p-4 border-2 border-dashed rounded-xl text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-glass-border group-hover:border-primary/50'}`}>
                                    <span className="text-sm text-gray-400">
                                        {file ? `📄 ${file.name}` : 'Click to select .docx file'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" disabled={!file || loading} className="w-full md:w-auto px-10 py-4">
                            {loading ? 'Uploading...' : 'Upload Template'}
                        </Button>
                    </form>
                )}
            </Card>

            <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="bg-white/5 p-2 rounded-lg mr-3 text-sm">📂</span>
                Existing Templates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(templates) && templates.map(t => (
                    <Card key={t._id} className="hover:border-primary/30 transition-all group overflow-hidden flex flex-col h-full">
                        {/* Thumbnail Preview */}
                        <div className="relative aspect-[1.414/1] w-full bg-slate-800/50 mb-4 rounded-lg overflow-hidden border border-glass-border">
                            {t.thumbnailPath ? (
                                <img
                                    src={`${API_URL}/${t.thumbnailPath}`}
                                    alt={t.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                    <span className="text-4xl mb-2">📄</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">No Preview</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-[10px] text-white/70 font-medium">Click generate to use this template</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{t.name}</h3>
                            <Button
                                onClick={() => handleDelete(t._id)}
                                variant="danger"
                                className="text-[10px] py-1 px-3 font-bold uppercase tracking-wider h-auto shadow-lg shadow-red-900/20"
                            >
                                Delete
                            </Button>
                        </div>

                        <div className="mb-6 flex-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Placeholders Detected</span>
                            <div className="flex flex-wrap gap-2">
                                {t.placeholders.slice(0, 4).map(p => (
                                    <span key={p} className="bg-primary/10 text-[9px] px-2 py-0.5 rounded-md text-primary font-mono border border-primary/20">
                                        {p}
                                    </span>
                                ))}
                                {t.placeholders.length > 4 && (
                                    <span className="text-[9px] text-gray-500 self-center">+{t.placeholders.length - 4} more</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-glass-border flex items-center justify-between mt-auto">
                            <span className="text-[10px] text-gray-500 font-mono italic">
                                {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </Card>
                ))}

                {templates.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-glass-border rounded-3xl">
                        <p className="text-gray-500 mb-4 text-lg">No templates found in your library.</p>
                        <p className="text-sm text-gray-600">Upload your first .docx template above to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
