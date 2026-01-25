"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function BulkGeneratePage() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [rowCount, setRowCount] = useState(0);
    const [qrX, setQrX] = useState(50);
    const [qrY, setQrY] = useState(50);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/templates`, {
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
        setResult(null);
        setRecipientEmail('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCsvFile(file);
        setResult(null);
        setRecipientEmail('');

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                // Count lines, filter out empty ones
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
                // Subtract 1 for the header
                const count = Math.max(0, lines.length - 1);
                setRowCount(count);
            };
            reader.readAsText(file);
        } else {
            setRowCount(0);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !csvFile) return;

        const token = localStorage.getItem('token');
        setGenerating(true);
        setResult(null);

        const formData = new FormData();
        formData.append('csvFile', csvFile);
        formData.append('templateId', selectedTemplate._id);
        formData.append('qrX', qrX);
        formData.append('qrY', qrY);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/generate-bulk`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                alert(data.error || 'Bulk generation failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error during bulk generation');
        }
        setGenerating(false);
    };

    const handleSendEmail = async () => {
        if (!recipientEmail || !result) return;

        setSending(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    documentId: `zip:${result.downloadUrl}`, // Prefix for backend switch
                    recipientEmail: recipientEmail
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Success: Batch ZIP has been emailed!');
                setRecipientEmail('');
            } else {
                alert(data.error || 'Failed to send batch email');
            }
        } catch (err) {
            console.error(err);
            alert('Error sending batch email');
        }
        setSending(false);
    };

    const downloadSampleCSV = () => {
        if (!selectedTemplate) return;

        // Create sample CSV with placeholders as headers
        const headers = selectedTemplate.placeholders.filter(p => p !== 'certificate_id' && p !== 'qr_code');
        const sampleRow = headers.map(h => `Sample ${h}`);

        const csvContent = [
            headers.join(','),
            sampleRow.join(','),
            sampleRow.join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplate.name}_sample.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Bulk Generation</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card title="Upload Configuration" subtitle="Configure your bulk certificate generation">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Select Template</label>
                            <select
                                className="input bg-white/5 border-glass-border focus:border-primary transition-all cursor-pointer"
                                onChange={handleTemplateSelect}
                            >
                                <option value="" className="bg-slate-900">-- Choose Template --</option>
                                {Array.isArray(templates) && templates.map(t => (
                                    <option key={t._id} value={t._id} className="bg-slate-900">{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedTemplate && (
                            <form onSubmit={handleGenerate} className="space-y-6">
                                <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-primary flex items-center">
                                            <span className="mr-2 italic">Format:</span> CSV Required
                                        </h3>
                                        <Button
                                            onClick={downloadSampleCSV}
                                            variant="ghost"
                                            className="text-xs py-1.5 px-3 border border-primary/20 hover:bg-primary/10"
                                        >
                                            Download Sample
                                        </Button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg font-mono text-xs text-gray-400 overflow-x-auto whitespace-nowrap border border-white/5">
                                        {selectedTemplate.placeholders
                                            .filter(p => p !== 'certificate_id' && p !== 'qr_code')
                                            .join(', ') || 'No placeholders required'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">File Upload</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <div className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${csvFile ? 'border-green-500/50 bg-green-500/5' : 'border-glass-border group-hover:border-primary/50'}`}>
                                            <div className="text-4xl mb-3">{csvFile ? '📊' : '📁'}</div>
                                            <div className="font-medium text-gray-300">{csvFile ? csvFile.name : 'Select or drop CSV file'}</div>
                                            {csvFile && (
                                                <div className="mt-2 text-xs font-bold text-green-400 uppercase tracking-widest">
                                                    ✨ Detected: {rowCount} Certificates
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-500 mt-1">{csvFile ? `${(csvFile.size / 1024).toFixed(2)} KB` : 'Max file size 10MB'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="QR Code X (px)"
                                        type="number"
                                        value={qrX}
                                        onChange={(e) => setQrX(parseInt(e.target.value) || 0)}
                                    />
                                    <Input
                                        label="QR Code Y (px)"
                                        type="number"
                                        value={qrY}
                                        onChange={(e) => setQrY(parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full py-4 text-lg"
                                    disabled={generating || !selectedTemplate || !csvFile}
                                >
                                    {generating ? (
                                        <span className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                            Processing Units...
                                        </span>
                                    ) : 'Start Generation'}
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Help" className="bg-white/5">
                        <ul className="text-sm text-gray-400 space-y-4">
                            <li className="flex items-start">
                                <span className="bg-primary/20 text-primary p-1 rounded mr-3 text-[10px] mt-1">1</span>
                                <div>Choose a template you've created earlier.</div>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-primary/20 text-primary p-1 rounded mr-3 text-[10px] mt-1">2</span>
                                <div>Download the sample to see exact column names needed.</div>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-primary/20 text-primary p-1 rounded mr-3 text-[10px] mt-1">3</span>
                                <div>Adjust QR code position based on your template design.</div>
                            </li>
                        </ul>
                    </Card>

                    {result && (
                        <Card className="border-green-500/30 bg-green-500/5 animate-fade-in" title="Results">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-medium uppercase tracking-tighter">Status</span>
                                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold uppercase">Success</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/30 p-4 rounded-xl text-center">
                                        <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">Generated</div>
                                        <div className="text-2xl font-bold text-green-400">{result.generated}</div>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-xl text-center">
                                        <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">Failed</div>
                                        <div className="text-2xl font-bold text-red-400">{result.failed}</div>
                                    </div>
                                </div>

                                {result.errors && result.errors.length > 0 && (
                                    <div className="max-h-32 overflow-y-auto p-3 bg-red-900/10 rounded-lg text-xs font-mono text-red-400/80 border border-red-500/10">
                                        {result.errors.map((err, idx) => (
                                            <div key={idx} className="mb-1">Row {err.row}: {err.error}</div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3">
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${result.downloadUrl}`}
                                        className="block"
                                        download
                                    >
                                        <Button className="w-full bg-green-600 hover:bg-green-700 hover:shadow-green-500/20 shadow-lg border-none py-3">
                                            📦 Download ZIP
                                        </Button>
                                    </a>
                                </div>

                                <div className="pt-4 border-t border-white/10 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Entire Batch</h4>
                                    <Input
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        className="bg-black/20"
                                    />
                                    <Button
                                        onClick={handleSendEmail}
                                        className="w-full text-sm"
                                        disabled={!recipientEmail || sending}
                                    >
                                        {sending ? 'Sending Batch...' : '📧 Send ZIP via Email'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
