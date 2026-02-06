"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import {
    Card,
    Button,
    TemplatePreview
} from '@/components';
import Link from 'next/link';
import { getTemplates, updateTemplateName, toggleTemplateStatus, deleteTemplate } from '@/services/TemplateLib';
import { getApiUrl } from '@/services/apiService';

export default function ExistingTemplatesPage() {
    const { showAlert, showConfirm, showTemplatePreview, showTemplateRename } = useUI();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const limit = 10;



    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await getTemplates({
                search,
                page,
                limit,
                sortBy,
                sortOrder
            });


            if (data && Array.isArray(data.templates)) {
                setTemplates(data.templates);
                setTotalPages(data.pages);
                setTotalDocs(data.total);
            } else {
                setTemplates([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
            // 401 redirect is handled by interceptor
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTemplates();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, page, sortBy, sortOrder]);


    const handleEditName = async (template) => {
        showTemplateRename(template, async (newName) => {
            if (!newName || newName === template.name) return;
            try {
                await updateTemplateName(template._id, newName);
                fetchTemplates();
            } catch (err) {
                console.error('Error updating template name:', err);
                const errorMsg = err.response?.data?.error || 'Update failed';
                showAlert('Failed', errorMsg, 'error');
                throw err;
            }
        });
    };

    const handleToggleStatus = async (id) => {
        try {
            await toggleTemplateStatus(id);
            fetchTemplates();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to update status';
            showAlert('Error', errorMsg, 'error');
        }
    };

    const handleDeleteTemplate = async (id) => {
        showConfirm(
            'Delete Template',
            'Are you sure you want to delete this template? This cannot be undone.',
            async () => {
                try {
                    await deleteTemplate(id);
                    fetchTemplates();
                } catch (err) {
                    console.error(err);
                    const errorMsg = err.response?.data?.error || 'Delete failed';
                    showAlert('Error', errorMsg, 'error');
                }
            }
        );
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* Action Bar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-card p-4 rounded-lg border border-border shadow-card gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                    <div className="w-full md:w-96 group relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <path d="M11 7a4 4 0 0 0-4 4" opacity="0.3"></path>
                            </svg>
                        </span>
                        <input
                            placeholder="Search templates by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                        />
                    </div>

                    <div className="hidden">
                        {/* Hidden limit variable tracker for easier replacement */}
                        {(() => { global.templatesLimit = 5; })()}
                    </div>


                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-md border border-border whitespace-nowrap">
                        <span className="text-[10px] uppercase font-medium text-gray-500 tracking-wider">Total Templates</span>
                        <div className="w-px h-3 bg-border"></div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                            </span>
                            <span className="text-sm font-bold text-foreground">{loading && templates.length === 0 ? '...' : totalDocs}</span>
                        </div>
                    </div>
                </div>

                <Link href="/dashboard/templates" className="w-full md:w-auto">
                    <Button variant="primary" className="w-full md:w-auto px-6 py-2.5 rounded-md text-xs uppercase font-medium tracking-widest">
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
                <div className="rounded-lg border border-border bg-card overflow-hidden shadow-card">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-border h-[60px]">
                                    <th className="px-6 py-0 w-[80px] text-center">S.No</th>
                                    <th className="px-6 py-0 w-[20%]">
                                        <button
                                            onClick={() => {
                                                if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                else { setSortBy('name'); setSortOrder('asc'); }
                                            }}
                                            className="flex items-center gap-1 hover:text-primary transition-colors uppercase"
                                        >
                                            Template Name
                                            <span className="text-[10px]">
                                                {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                            </span>
                                        </button>
                                    </th>
                                    <th className="px-6 py-0 w-[10%] text-center">Preview</th>
                                    <th className="px-6 py-0 w-[10%] text-center whitespace-nowrap">Certs Issued</th>
                                    <th className="px-6 py-0 w-[10%] text-center">Status</th>
                                    <th className="px-6 py-0 w-[20%]">Placeholders</th>
                                    <th className="px-6 py-0 w-[30%] text-center">Action</th>
                                </tr>

                            </thead>
                            <tbody className="divide-y divide-border">
                                {templates.length > 0 ? (
                                    <>
                                        {templates.map((t, index) => (
                                            <tr key={t._id} className={`hover:bg-gray-50/50 transition-all group h-[80px] ${t.enabled === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                                <td className="px-6 py-0 text-xs text-gray-600 font-mono text-center">
                                                    <div className="h-[80px] flex items-center justify-center">
                                                        {((page - 1) * limit) + index + 1}
                                                    </div>

                                                </td>
                                                <td className="px-6 py-0">
                                                    <div className="h-[80px] flex flex-col justify-center">
                                                        <div className={`text-sm font-normal tracking-tight transition-colors ${t.enabled !== false ? 'text-foreground group-hover:text-primary' : 'text-gray-400'}`}>
                                                            {t.name.replace(/\.[^/.]+$/, "")}
                                                        </div>
                                                        <div className="text-[10px] text-gray-600 flex items-center gap-1.5 font-mono mt-0.5">
                                                            <span>ID: {t._id.slice(-8)}</span>
                                                            <span className="text-gray-300">|</span>
                                                            <button
                                                                onClick={() => {
                                                                    if (sortBy === 'createdAt') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                                    else { setSortBy('createdAt'); setSortOrder('desc'); }
                                                                }}
                                                                className={`hover:text-primary flex items-center gap-0.5 ${sortBy === 'createdAt' ? 'text-primary font-bold' : ''}`}
                                                                title="Sort by Date"
                                                            >
                                                                {new Date(t.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                                <span className="text-[8px]">{sortBy === 'createdAt' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-0">
                                                    <div className="h-[80px] flex items-center justify-center">
                                                        <div className={`w-20 h-14 rounded-lg overflow-hidden border bg-gray-50 cursor-pointer transition-all shadow-sm ${t.enabled !== false ? 'border-border hover:border-primary/50' : 'border-border/50 opacity-50'}`} onClick={() => showTemplatePreview(t)}>
                                                            {t.thumbnailPath ? (
                                                                <img src={getApiUrl(`/${t.thumbnailPath}`)} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-lg">📄</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0 whitespace-nowrap">
                                                    <div className="h-[80px] flex items-center justify-center">
                                                        <Link
                                                            href={`/dashboard/documents?templateId=${t._id}`}
                                                            className={`flex items-center justify-center gap-2 group/stat cursor-pointer ${t.enabled === false ? 'pointer-events-none' : ''}`}
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${t.enabled !== false ? 'bg-primary animate-pulse' : 'bg-gray-600'}`}></span>
                                                            <span className={`text-sm font-medium group-hover/stat:text-primary transition-colors underline-offset-4 group-hover/stat:underline ${t.enabled !== false ? 'text-foreground' : 'text-gray-400'}`}>
                                                                {t.documentCount || 0}
                                                            </span>
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0 text-center">
                                                    <div className="h-[80px] flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleToggleStatus(t._id)}
                                                            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${t.enabled !== false ? 'bg-primary/20 p-1' : 'bg-gray-200 p-1'}`}
                                                        >
                                                            <div className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${t.enabled !== false ? 'bg-primary translate-x-5' : 'bg-gray-500'}`}></div>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0">
                                                    <div className="h-[80px] flex flex-wrap gap-1 content-center max-w-[200px]">
                                                        {t.placeholders?.slice(0, 3).map(p => (
                                                            <span key={p} className="bg-gray-50 text-[9px] px-2 py-0.5 rounded text-muted font-mono border border-border italic whitespace-nowrap">
                                                                {p}
                                                            </span>
                                                        ))}
                                                        {t.placeholders?.length > 3 && (
                                                            <span className="text-[9px] text-gray-500 font-medium self-center">+{t.placeholders.length - 3}</span>
                                                        )}
                                                        {t.placeholders?.length === 0 && (
                                                            <span className="text-[9px] text-gray-400 italic">No placeholders</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0 text-center">
                                                    <div className="h-[80px] flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => showTemplatePreview(t)}
                                                            className="w-8 h-8 rounded-lg bg-gray-50 border border-border flex items-center justify-center text-gray-500 hover:bg-primary/20 hover:text-primary transition-all"
                                                            title="Quick Preview"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditName(t)}
                                                            className="w-8 h-8 rounded-lg bg-gray-50 border border-border flex items-center justify-center text-gray-500 hover:bg-orange-500/20 hover:text-orange-500 transition-all"
                                                            title="Rename"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTemplate(t._id)}
                                                            className="w-8 h-8 rounded-lg bg-gray-50 border border-border flex items-center justify-center text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                        </button>
                                                        <Link
                                                            href={`/dashboard/generate?templateId=${t._id}`}
                                                            className={`h-8 px-4 flex items-center justify-center border text-[10px] font-medium  rounded-lg transition-all leading-none ${t.enabled !== false
                                                                ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary hover:text-black shadow-lg shadow-primary/10'
                                                                : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed pointer-events-none'}`}
                                                        >
                                                            Use Template
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {templates.length < limit && templates.length > 0 &&
                                            [...Array(limit - templates.length)].map((_, i) => (
                                                <tr key={`empty-${i}`} className="h-[80px]">
                                                    <td colSpan="7" className="px-6 py-0">
                                                        <div className="h-[80px]"></div>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
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
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-border">
                            <div className="text-xs text-muted">
                                Showing <span className="text-foreground font-medium">{((page - 1) * limit) + 1}</span> to <span className="text-foreground font-medium">{Math.min(page * limit, totalDocs)}</span> of <span className="text-foreground font-medium">{totalDocs}</span> templates
                            </div>


                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    className="text-[10px] uppercase font-medium py-2 px-4 border border-border disabled:opacity-30"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                {(() => {
                                    if (totalPages <= 6) {
                                        return [...Array(totalPages)].map((_, i) => i + 1);
                                    }
                                    return [1, 2, 3, 4, 5, '...', totalPages];
                                })().map((p, i) => (
                                    p === '...' ? (
                                        <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs font-bold">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-[10px] font-medium transition-all ${page === p
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-gray-50 text-muted hover:bg-gray-100 border border-border'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                ))}
                                <Button
                                    variant="ghost"
                                    className="text-[10px] uppercase font-medium py-2 px-4 border border-border disabled:opacity-30"
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

        </div>
    );
}
