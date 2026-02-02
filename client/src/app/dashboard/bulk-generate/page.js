"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import FileUpload from '@/components/FileUpload';
import TemplateSelector from '@/components/TemplateSelector';
import TemplatePreview from '@/components/TemplatePreview';



export default function BulkGeneratePage() {
    const { showAlert } = useUI();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [rowCount, setRowCount] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [sending, setSending] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_URL}/api/templates?onlyEnabled=true&limit=1000`, {
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
                } else if (data && Array.isArray(data.templates)) {
                    setTemplates(data.templates);
                } else if (data) {
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
                showAlert('Batch Failed', data.error || 'Bulk generation failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Error during bulk generation', 'error');
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
                showAlert('Success', 'Batch ZIP has been emailed successfully!', 'info');
                setRecipientEmail('');
            } else {
                showAlert('Email Failed', data.error || 'Failed to send batch email', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Error sending batch email', 'error');
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
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* <h1 className="text-4xl font-bold mb-10">Generate Multiple Certificates</h1> */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`${result ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <Card className="p-8">
                        <div className="mb-10 p-8 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                            <h4 className="text-xl font-bold text-primary flex items-center uppercase tracking-wider">
                                <span className="mr-3 text-2xl">🚀</span> Bulk Processing Guidelines
                            </h4>
                            <ul className="text-base text-foreground space-y-3 ml-10 list-disc leading-relaxed font-medium">
                                <li>Upload a <span className="text-foreground font-medium">CSV File</span> where the headers match exactly with your template's placeholders.</li>
                                <li>Download the <span className="italic">"Sample CSV"</span> (available after template selection) for the correct column structure.</li>
                                <li>The system will generate a <span className="text-foreground font-medium">ZIP Archive</span> containing all successfully generated PDFs.</li>
                                <li>Any row with <span className="text-red-600 font-bold">Incomplete Data</span> will be skipped and reported in the failure log.</li>
                            </ul>
                        </div>

                        <TemplateSelector
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onTemplateSelect={handleTemplateSelect}
                            label="Select Template"
                        />

                        <TemplatePreview
                            template={selectedTemplate}
                            maxWidth="300px"
                            className="mb-8"
                            overlayText="Batch processing ready"
                        />


                        {selectedTemplate && (
                            <form onSubmit={handleGenerate} className="space-y-6">
                                <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium text-primary flex items-center">
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
                                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs text-muted overflow-x-auto whitespace-nowrap border border-border">
                                        {selectedTemplate.placeholders
                                            .filter(p => p !== 'certificate_id' && p !== 'qr_code')
                                            .join(', ') || 'No placeholders required'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted mb-2 uppercase tracking-wider">File Upload</label>
                                    <FileUpload
                                        file={csvFile}
                                        onFileChange={handleFileChange}
                                        accept=".csv"
                                        placeholder="Select or drop CSV file"
                                        icon="📊"
                                        selectedIcon="📈"
                                        rowCountText={csvFile ? `✨ Detected: ${rowCount} Certificates` : ""}
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
                    {/* Active results and stats */}

                    {result && (
                        <Card className="border-green-500/30 bg-green-500/5 animate-fade-in" title="Results">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-medium uppercase tracking-tighter">Status</span>
                                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium uppercase">Success</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-4 rounded-xl text-center border border-border">
                                        <div className="text-muted text-[10px] uppercase font-medium mb-1">Generated</div>
                                        <div className="text-2xl font-medium text-green-500">{result.generated}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl text-center border border-border">
                                        <div className="text-muted text-[10px] uppercase font-medium mb-1">Failed</div>
                                        <div className="text-2xl font-medium text-red-500">{result.failed}</div>
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

                                <div className="pt-4 border-t border-border space-y-4">
                                    <h4 className="text-xs font-medium uppercase tracking-widest text-muted">Email Entire Batch</h4>
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
