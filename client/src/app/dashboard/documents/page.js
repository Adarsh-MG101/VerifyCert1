"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import TemplateSelector from '@/components/TemplateSelector';
import Modal from '@/components/Modal';

export default function DocumentsPage() {
    const { showAlert } = useUI();
    const searchParams = useSearchParams();
    const templateIdParam = searchParams.get('templateId');

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(templateIdParam || '');
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
                const res = await fetch(`${API_URL}/api/templates?limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTemplates(data);
                } else if (data && Array.isArray(data.templates)) {
                    setTemplates(data.templates);
                }
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
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">


            {/* Filter Section */}
            <Card className="mb-4 overflow-visible p-3!">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        label="Search ID or Name"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="!uppercase-none"
                        compact={true}
                    />
                    <TemplateSelector
                        label="Template"
                        templates={templates}
                        selectedTemplate={selectedTemplate}
                        onTemplateSelect={(e) => setSelectedTemplate(e.target.value)}
                        className="mb-0"
                        compact={true}
                    />
                    <Input
                        label="From Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        compact={true}
                    />
                    <Input
                        label="To Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        compact={true}
                    />
                </div>

                {(search || startDate || endDate || selectedTemplate) && (
                    <div className="flex flex-col items-center mt-4">
                        <button
                            onClick={() => {
                                setSearch('');
                                setStartDate('');
                                setEndDate('');
                                setSelectedTemplate('');
                                setPage(1);
                            }}
                            className="flex flex-col items-center gap-1 group transition-all text-gray-300 hover:text-primary active:scale-95"
                        >
                            <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                    <path d="M3 3v5h5"></path>
                                </svg>
                            </div>
                            <span className="text-[9px] font-medium uppercase tracking-widest">
                                Reset
                            </span>
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
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-border h-[60px]">
                                    <th className="px-6 py-0 text-center w-[80px]">S.No</th>
                                    <th className="px-6 py-0 text-center w-[20%]">Template</th>
                                    <th className="px-6 py-0 text-center w-[30%]">Details</th>
                                    <th className="px-6 py-0 text-center w-[15%]">Generated On</th>
                                    <th className="px-6 py-0 text-center w-[25%]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {documents.length > 0 ? (
                                    <>
                                        {documents.map((doc, index) => (
                                            <tr key={doc._id} className="hover:bg-gray-50/50 transition-all group h-[80px]">
                                                <td className="px-6 py-0 text-xs text-gray-600 font-mono text-center">
                                                    <div className="h-[80px] flex items-center justify-center">
                                                        {((page - 1) * limit) + index + 1}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-0 text-center">
                                                    <div className="h-[80px] flex items-center justify-center">
                                                        <div className="text-sm font-medium text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                                            {doc.template?.name?.replace(/\.[^/.]+$/, "") || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0">
                                                    <div className="h-[80px] flex flex-wrap gap-1 justify-center content-center max-w-[220px] mx-auto overflow-hidden">
                                                        {Object.entries(doc.data || {})
                                                            .filter(([key]) => !['QR', 'QRCODE', 'CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID', 'certificate_id'].includes(key.toUpperCase()) && !key.includes(' '))
                                                            .slice(0, 3)
                                                            .map(([key, val]) => (
                                                                <span key={key} className="bg-gray-50 text-[9px] px-2 py-0.5 rounded text-muted font-mono border border-border italic whitespace-nowrap">
                                                                    {key}: {val}
                                                                </span>
                                                            ))}
                                                        {Object.entries(doc.data || {}).filter(([key]) => !['QR', 'QRCODE', 'CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID', 'certificate_id'].includes(key.toUpperCase()) && !key.includes(' ')).length > 3 && (
                                                            <span className="text-[9px] text-gray-500 font-medium self-center">
                                                                +{Object.entries(doc.data || {}).filter(([key]) => !['QR', 'QRCODE', 'CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID', 'certificate_id'].includes(key.toUpperCase()) && !key.includes(' ')).length - 3}
                                                            </span>
                                                        )}
                                                        {Object.entries(doc.data || {}).filter(([key]) => !['QR', 'QRCODE', 'CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID', 'certificate_id'].includes(key.toUpperCase()) && !key.includes(' ')).length === 0 && (
                                                            <span className="text-[9px] text-gray-400 italic">No extra data</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0 text-center">
                                                    <div className="h-[80px] flex flex-col justify-center">
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(doc.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-gray-600">
                                                            {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-0 text-center">
                                                    <div className="h-[80px] flex items-center justify-center gap-2">
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
                                                            className="inline-flex items-center gap-2 group/pdf"
                                                        >
                                                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-border rounded-xl group-hover/pdf:bg-primary/10 group-hover/pdf:border-primary/30 transition-all shadow-sm">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary transition-transform group-hover/pdf:scale-110">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                                </svg>
                                                                <span className="text-[11px] font-medium text-gray-900 tracking-tight">PDF</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {documents.length < limit && documents.length > 0 &&
                                            [...Array(limit - documents.length)].map((_, i) => (
                                                <tr key={`empty-${i}`} className="h-[80px]">
                                                    <td colSpan="5"><div className="h-[80px]"></div></td>
                                                </tr>
                                            ))
                                        }
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
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
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-border">
                            <div className="text-xs text-muted">
                                Showing <span className="text-foreground font-medium">{((page - 1) * limit) + 1}</span> to <span className="text-foreground font-medium">{Math.min(page * limit, totalDocs)}</span> of <span className="text-foreground font-medium">{totalDocs}</span> documents
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
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-medium transition-all ${page === i + 1
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-gray-50 text-muted hover:bg-gray-100 border border-border'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
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
