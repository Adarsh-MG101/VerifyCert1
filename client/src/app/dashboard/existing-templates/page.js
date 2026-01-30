"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import TemplatePreview from '@/components/TemplatePreview';
import Modal from '@/components/Modal';
import Input from '@/components/Input';

export default function ExistingTemplatesPage() {
    const { showAlert, showConfirm } = useUI();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const limit = 5;

    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchTemplates = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page);
        params.append('limit', limit);

        fetch(`${API_URL}/api/templates?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                return res.ok ? res.json() : { templates: [], total: 0, pages: 1 };
            })
            .then(data => {
                if (data && Array.isArray(data.templates)) {
                    setTemplates(data.templates);
                    setTotalPages(data.pages);
                    setTotalDocs(data.total);
                } else {
                    setTemplates([]);
                    setTotalPages(1);
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
        setPage(1);
    }, [search]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTemplates();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, page]);

    const handleEditName = async (e) => {
        e.preventDefault();
        if (!editingTemplate || !newName || newName === editingTemplate.name) {
            setEditingTemplate(null);
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/templates/${editingTemplate._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                setEditingTemplate(null);
                fetchTemplates();
            } else {
                const data = await res.json();
                showAlert('Failed', data.error || 'Update failed', 'error');
            }
        } catch (err) {
            console.error('Error updating template name:', err);
        }
        setSaving(false);
    };

    const handleToggleStatus = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/templates/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchTemplates();
            } else {
                showAlert('Error', 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'An error occurred while updating status', 'error');
        }
    };

    const handleDelete = async (id) => {
        showConfirm(
            'Delete Template',
            'Are you sure you want to delete this template? This cannot be undone.',
            async () => {
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
                        showAlert('Error', 'Delete failed', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showAlert('Error', 'An error occurred while deleting', 'error');
                }
            }
        );
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-10">
            {/* Header with Stats */}
            {/* Action Bar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-slate-900/40 backdrop-blur-xl p-4 rounded-2xl border border-glass-border shadow-lg gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                    <div className="w-full md:w-96 group relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">🔍</span>
                        <input
                            placeholder="Search templates by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider leading-none mb-1">Total Templates</span>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                </span>
                                <span className="text-lg font-black text-white">{loading && templates.length === 0 ? '...' : totalDocs}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Link href="/dashboard/templates" className="w-full md:w-auto">
                    <Button variant="primary" className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs uppercase font-bold tracking-widest">
                        + Upload Template
                    </Button>
                </Link>
            </div>

            {/* Content Table */}
            {loading && templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 animate-pulse">Scanning your library...</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-glass-border bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-glass-border">
                                    <th className="px-6 py-5 w-16">S.No</th>
                                    <th className="px-6 py-5">Template Name</th>
                                    <th className="px-6 py-5">Preview</th>
                                    <th className="px-6 py-5">Certs Issued</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-6 py-5">Placeholders</th>
                                    <th className="px-6 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/50">
                                {templates.length > 0 ? templates.map((t, index) => (
                                    <tr key={t._id} className={`hover:bg-white/5 transition-all group ${t.enabled === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                        <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                                            {((page - 1) * limit) + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`text-sm font-bold uppercase tracking-tight transition-colors ${t.enabled !== false ? 'text-white group-hover:text-primary' : 'text-gray-500'}`}>
                                                {t.name}
                                                {t.enabled === false && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400 border border-white/5">DISABLED</span>}
                                            </div>
                                            <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                                                ID: {t._id.slice(-8)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`w-20 h-14 rounded-lg overflow-hidden border bg-black/40 cursor-pointer transition-all shadow-md ${t.enabled !== false ? 'border-white/10 hover:border-primary/50' : 'border-white/5 opacity-50'}`} onClick={() => setPreviewTemplate(t)}>
                                                {t.thumbnailPath ? (
                                                    <img src={`${API_URL}/${t.thumbnailPath}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg">📄</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/dashboard/documents?templateId=${t._id}`}
                                                className={`flex items-center gap-2 group/stat cursor-pointer w-fit ${t.enabled === false ? 'pointer-events-none' : ''}`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${t.enabled !== false ? 'bg-primary animate-pulse' : 'bg-gray-600'}`}></span>
                                                <span className={`text-sm font-black group-hover/stat:text-primary transition-colors underline-offset-4 group-hover/stat:underline ${t.enabled !== false ? 'text-white' : 'text-gray-500'}`}>
                                                    {t.documentCount || 0}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleToggleStatus(t._id)}
                                                    className={`relative w-10 h-5 rounded-full transition-all duration-300 ${t.enabled !== false ? 'bg-primary/40 p-1' : 'bg-white/10 p-1'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${t.enabled !== false ? 'bg-primary translate-x-5' : 'bg-gray-500'}`}></div>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {t.placeholders?.slice(0, 3).map(p => (
                                                    <span key={p} className="bg-white/5 text-[9px] px-2 py-0.5 rounded text-gray-400 font-mono border border-white/5 italic">
                                                        {p}
                                                    </span>
                                                ))}
                                                {t.placeholders?.length > 3 && (
                                                    <span className="text-[9px] text-gray-500 font-bold self-center">+{t.placeholders.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setPreviewTemplate(t)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-primary/20 hover:text-primary transition-all"
                                                    title="Quick Preview"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </button>
                                                <button
                                                    onClick={() => { setEditingTemplate(t); setNewName(t.name); }}
                                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-orange-500/20 hover:text-orange-500 transition-all"
                                                    title="Rename"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t._id)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                </button>
                                                <Link
                                                    href={`/dashboard/generate?templateId=${t._id}`}
                                                    className={`h-8 px-4 flex items-center justify-center border text-[10px] font-black uppercase rounded-lg transition-all ${t.enabled !== false
                                                        ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary hover:text-black shadow-lg shadow-primary/10'
                                                        : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed pointer-events-none'}`}
                                                >
                                                    Use Template
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl mb-4 grayscale opacity-50">📂</span>
                                                <p className="text-gray-500 font-medium">No templates found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-glass-border">
                            <div className="text-xs text-gray-400">
                                Showing <span className="text-white font-bold">{((page - 1) * limit) + 1}</span> to <span className="text-white font-bold">{Math.min(page * limit, totalDocs)}</span> of <span className="text-white font-bold">{totalDocs}</span> templates
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    className="text-[10px] uppercase font-bold py-2 px-4 border border-white/10 disabled:opacity-30"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${page === i + 1
                                            ? 'bg-primary text-black shadow-lg shadow-primary/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <Button
                                    variant="ghost"
                                    className="text-[10px] uppercase font-bold py-2 px-4 border border-white/10 disabled:opacity-30"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <Modal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                title="Template Preview"
                subtitle={previewTemplate?.name}
            >
                <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                    <TemplatePreview
                        template={previewTemplate}
                        showLabel={false}
                        maxWidth="100%"
                    />
                </div>
                <div className="mt-8 flex gap-4">
                    <Button className="flex-1" onClick={() => {
                        window.location.href = `/dashboard/generate?templateId=${previewTemplate._id}`;
                    }}>Use Template</Button>
                </div>
            </Modal>

            <Modal
                isOpen={!!editingTemplate}
                onClose={() => setEditingTemplate(null)}
                title="Rename Template"
                subtitle={`Current: ${editingTemplate?.name}`}
            >
                <form onSubmit={handleEditName} className="space-y-6">
                    <Input
                        label="New Template Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new name..."
                        required
                    />
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1 border border-white/10" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                        <Button className="flex-2" type="submit" disabled={saving || !newName || newName === editingTemplate?.name}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
