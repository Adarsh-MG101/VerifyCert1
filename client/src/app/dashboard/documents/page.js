"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import TemplateSelector from '@/components/TemplateSelector';
import Modal from '@/components/Modal';

export default function DocumentsPage() {
    const { showAlert } = useUI();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [selectedDocForEmail, setSelectedDocForEmail] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const limit = 5;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchDocuments = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (selectedTemplate) params.append('templateId', selectedTemplate);
            params.append('page', page);
            params.append('limit', limit);

            const res = await fetch(`${API_URL}/api/documents?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data && Array.isArray(data.documents)) {
                setDocuments(data.documents);
                setTotalPages(data.pages);
                setTotalDocs(data.total);
            } else {
                setDocuments([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setDocuments([]);
        }
        setLoading(false);
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!selectedDocForEmail || !recipientEmail) return;

        setSendingEmail(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    documentId: selectedDocForEmail._id,
                    recipientEmail: recipientEmail
                })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert('Success', 'Certificate has been emailed successfully!', 'info');
                setSelectedDocForEmail(null);
                setRecipientEmail('');
            } else {
                showAlert('Email Failed', data.error || 'Failed to send email', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'An unexpected error occurred', 'error');
        }
        setSendingEmail(false);
    };

    useEffect(() => {
        const fetchTemplates = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/templates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) setTemplates(data);
            } catch (err) {
                console.error('Error fetching templates:', err);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        setPage(1); // Reset to first page on filter change
    }, [search, startDate, endDate, selectedTemplate]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchDocuments();
        }, 300); // Small debounce for search
        return () => clearTimeout(timeoutId);
    }, [search, startDate, endDate, selectedTemplate, page]);

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold">Generated PDFs</h1>

                <div className="flex items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-glass-border px-5 py-3 rounded-2xl shadow-xl">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] leading-none mb-1.5">Search Results</span>
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </div>
                            <span className="text-xl font-black text-white tracking-tighter">
                                {loading && documents.length === 0 ? '...' : totalDocs}
                                <span className="text-xs font-bold text-gray-400 ml-1.5 uppercase tracking-normal">Certificates Found</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="mb-8 overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-2">
                    <Input
                        label="Search ID or Name"
                        placeholder="Ex: 1234 or John Doe"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="!uppercase-none" // We don't want to enforce uppercase for IDs if they are UUIDs
                    />
                    <TemplateSelector
                        label="Filter by Template"
                        templates={templates}
                        selectedTemplate={selectedTemplate}
                        onTemplateSelect={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full"
                    />
                    <Input
                        label="From Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        label="To Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                {(search || startDate || endDate || selectedTemplate) && (
                    <div className="px-2 pb-2 flex justify-end">
                        <button
                            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setSelectedTemplate(''); }}
                            className="text-[10px] uppercase font-bold text-primary hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </Card>

            {/* Results Table */}
            {loading && documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 animate-pulse">Fetching your documents...</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-glass-border bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-glass-border">
                                    <th className="px-6 py-5">S.No</th>
                                    <th className="px-6 py-5">Unique ID</th>
                                    <th className="px-6 py-5">Template</th>
                                    <th className="px-6 py-5">Details</th>
                                    <th className="px-6 py-5">Generated On</th>
                                    <th className="px-6 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/50">
                                {documents.length > 0 ? documents.map((doc, index) => (
                                    <tr key={doc._id} className="hover:bg-white/5 transition-all group">
                                        <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                                            {((page - 1) * limit) + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-gray-400 bg-white/5 py-1 px-2 rounded-md w-fit border border-white/5">
                                                {doc.uniqueId.slice(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                                                {doc.template?.name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] text-gray-400 leading-tight max-w-[180px] wrap-break-word line-clamp-2">
                                                {Object.entries(doc.data || {})
                                                    .filter(([key]) => key !== 'QR' && key !== 'QRCODE' && key !== 'CERTIFICATE_ID')
                                                    .map(([key, val]) => `${key}: ${val}`)
                                                    .join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-400">
                                                {new Date(doc.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-gray-600">
                                                {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedDocForEmail(doc)}
                                                className="inline-flex items-center justify-center w-9 h-9 text-primary hover:bg-primary/10 transition-all rounded-lg border border-primary/20"
                                                title="Send via Email"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                            </button>
                                            <a
                                                href={`${API_URL}/${doc.filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[10px] uppercase font-bold text-primary hover:bg-primary hover:text-black transition-all px-4 py-2 rounded-lg border border-primary/30 group-hover:border-primary shadow-lg shadow-primary/5"
                                            >
                                                <span>Preview</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                            </a>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl mb-4 grayscale opacity-50">📂</span>
                                                <p className="text-gray-500 font-medium">No documents found matching your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-glass-border">
                            <div className="text-xs text-gray-400">
                                Showing <span className="text-white font-bold">{((page - 1) * limit) + 1}</span> to <span className="text-white font-bold">{Math.min(page * limit, totalDocs)}</span> of <span className="text-white font-bold">{totalDocs}</span> documents
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
            {/* Email Modal */}
            <Modal
                isOpen={!!selectedDocForEmail}
                onClose={() => setSelectedDocForEmail(null)}
                title="Send Certificate"
                subtitle={`Sending: ${selectedDocForEmail?.template?.name || 'Document'}`}
            >
                <form onSubmit={handleSendEmail} className="space-y-6">
                    <Input
                        label="Recipient Email"
                        type="email"
                        placeholder="recipient@example.com"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="bg-black/20"
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 border border-white/10"
                            onClick={() => setSelectedDocForEmail(null)}
                            disabled={sendingEmail}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-2"
                            disabled={sendingEmail || !recipientEmail}
                        >
                            {sendingEmail ? 'Sending...' : '📧 Send Email'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
