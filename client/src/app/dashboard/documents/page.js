"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchDocuments = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`${API_URL}/api/documents?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setDocuments(data);
            } else {
                setDocuments([]);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setDocuments([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchDocuments();
        }, 300); // Small debounce for search
        return () => clearTimeout(timeoutId);
    }, [search, startDate, endDate]);

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-10">
            <h1 className="text-3xl font-bold mb-8">Generated PDFs</h1>

            {/* Filter Section */}
            <Card className="mb-8 overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                    <Input
                        label="Search ID or Name"
                        placeholder="Ex: 1234 or John Doe"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="!uppercase-none" // We don't want to enforce uppercase for IDs if they are UUIDs
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
                {(search || startDate || endDate) && (
                    <div className="px-2 pb-2 flex justify-end">
                        <button
                            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
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
                                        <td className="px-6 py-4 text-xs text-gray-600 font-mono">{index + 1}</td>
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
                                            <div className="text-[10px] text-gray-400 leading-tight max-w-[180px] break-words line-clamp-2">
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
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`${API_URL}/${doc.filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[10px] uppercase font-bold text-primary hover:bg-primary hover:text-black transition-all px-4 py-2 rounded-lg border border-primary/30 group-hover:border-primary shadow-lg shadow-primary/5"
                                            >
                                                <span>Preview PDF</span>
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
                </div>
            )}
        </div>
    );
}
