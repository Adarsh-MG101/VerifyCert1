"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import FileUpload from '@/components/FileUpload';
import TemplateSelector from '@/components/TemplateSelector';
import TemplatePreview from '@/components/TemplatePreview';
import Modal from '@/components/Modal';
import { getTemplates } from '@/services/TemplateLib';
import { generateBulkCertificates, sendCertificateEmail } from '@/services/documentService';
import { getApiUrl } from '@/services/apiService';

import Guidelines from '@/components/Guidelines';

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
    const [showPreview, setShowPreview] = useState(false);
    useEffect(() => {
        const fetchTemplatesList = async () => {
            try {
                const response = await getTemplates({ onlyEnabled: true, limit: 1000 });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTemplates(data);
                } else if (data && Array.isArray(data.templates)) {
                    setTemplates(data.templates);
                } else if (data) {
                    console.error('Expected array of templates, got:', data);
                    setTemplates([]);
                }
            } catch (err) {
                console.error('Error fetching templates:', err);
                if (err.message?.includes('401')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                setTemplates([]);
            }
        };

        fetchTemplatesList();
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

        setGenerating(true);
        setResult(null);

        const formData = new FormData();
        formData.append('csvFile', csvFile);
        formData.append('templateId', selectedTemplate._id);

        try {
            const response = await generateBulkCertificates(formData);
            const data = await response.json();
            if (response.ok) {
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
        try {
            const response = await sendCertificateEmail(`zip:${result.downloadUrl}`, recipientEmail);
            const data = await response.json();
            if (response.ok) {
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
                        <Guidelines
                            title="Bulk Processing Guidelines"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>}
                            items={[
                                <>Upload a <span className="text-primary font-normal">CSV File</span> where the headers match exactly with your template's placeholders.</>,
                                <>Download the <span className="italic font-normal text-primary">"Sample CSV"</span> (available after selection) for the correct column structure.</>,
                                <>The system will generate a <span className="text-primary font-normal">ZIP Archive</span> containing all successfully generated PDFs.</>,
                                <>Any row with <span className="text-red-500 font-normal uppercase tracking-tighter">Incomplete Data</span> will be skipped and reported in the log.</>
                            ]}
                        />

                        <div className="flex items-center justify-between mb-8">
                            <TemplateSelector
                                templates={templates}
                                selectedTemplate={selectedTemplate}
                                onTemplateSelect={handleTemplateSelect}
                                label="Select Template"
                                className="mb-0 flex-1 mr-4"
                            />
                            {selectedTemplate && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowPreview(true)}
                                    className="mt-6 border border-border hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    Preview
                                </Button>
                            )}
                        </div>

                        {selectedTemplate && (
                            <Modal
                                isOpen={showPreview}
                                onClose={() => setShowPreview(false)}
                                title="Template Preview"
                                subtitle={selectedTemplate.name.replace(/\.[^/.]+$/, "")}
                                className="max-w-2xl"
                            >
                                <TemplatePreview
                                    template={selectedTemplate}
                                    showLabel={false}
                                />
                            </Modal>
                        )}


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
                                        href={getApiUrl(result.downloadUrl)}
                                        className="block"
                                        download
                                    >
                                        <Button className="w-full bg-green-600 hover:bg-green-700 hover:shadow-green-500/20 shadow-lg border-none py-3">
                                            📦 Download ZIP
                                        </Button>
                                    </a>
                                </div>

                                <div className="pt-4 border-t border-border space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Email Entire Batch</h4>
                                    <Input
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        className="bg-gray-50/50 border-gray-200 focus:bg-white"
                                    />
                                    <Button
                                        onClick={handleSendEmail}
                                        className="w-full py-3 h-auto"
                                        disabled={!recipientEmail || sending}
                                    >
                                        {sending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            "Send ZIP via Email"
                                        )}
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
