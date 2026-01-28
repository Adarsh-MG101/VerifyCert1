"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';

export default function ExistingTemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchTemplates = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
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
                } else {
                    setTemplates([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching templates:', err);
                setTemplates([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleEditName = async (id, currentName) => {
        const newName = prompt('Enter new template name:', currentName);
        if (!newName || newName === currentName) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/templates/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                fetchTemplates();
            } else {
                const data = await res.json();
                alert(data.error || 'Update failed');
            }
        } catch (err) {
            console.error('Error updating template name:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) return;

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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Existing Templates</h1>
                    <p className="text-gray-400 mt-1">Manage and preview your uploaded certificate templates</p>
                </div>
                <Link href="/dashboard/templates">
                    <Button variant="outline" className="text-sm">+ Upload New</Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading your library...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <Card key={t._id} className="hover:border-primary/30 transition-all group overflow-hidden flex flex-col h-full bg-slate-900/40">
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
                                    <span className="text-[10px] text-white/70 font-medium">Click buttons below to manage</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{t.name}</h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEditName(t._id, t.name)}
                                        className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                                        title="Edit Name"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t._id)}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                        title="Delete Template"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </div>
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
                                    Added: {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                                <Link href="/dashboard/generate">
                                    <span className="text-[10px] uppercase font-black text-primary hover:underline">Use Template →</span>
                                </Link>
                            </div>
                        </Card>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-glass-border rounded-3xl">
                            <div className="text-5xl mb-4">📂</div>
                            <p className="text-gray-400 mb-6 text-lg">Your template library is empty.</p>
                            <Link href="/dashboard/templates">
                                <Button>Upload Your First Template</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
