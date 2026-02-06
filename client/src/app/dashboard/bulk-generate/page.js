"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import {
    Card,
    Button,
    Input,
    FileUpload,
    TemplateSelector,
    TemplatePreview,
    Modal,
    Guidelines
} from '@/components';
import { getTemplates } from '@/services/TemplateLib';
import { generateBulkCertificates, sendCertificateEmail } from '@/services/documentService';
import { getApiUrl } from '@/services/apiService';

import { useTemplates, useEmail, useCsvFile } from '@/hooks';

export default function BulkGeneratePage() {
    const { showAlert, showTemplatePreview } = useUI();
    const {
        templates,
        selectedTemplate,
        handleTemplateSelect
    } = useTemplates({ onlyEnabled: true });

    const {
        file: csvFile,
        rowCount,
        handleFileChange: onFileChange
    } = useCsvFile();

    const { sending, sendEmail } = useEmail();

    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');

    const onTemplateSelect = (e) => {
        handleTemplateSelect(e, () => {
            setResult(null);
            setRecipientEmail('');
        });
    };

    const handleFileChange = (e) => {
        onFileChange(e, () => {
            setResult(null);
            setRecipientEmail('');
        });
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
            const data = await generateBulkCertificates(formData);
            setResult(data);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Bulk generation failed';
            showAlert('Batch Failed', errorMsg, 'error');
        }
        setGenerating(false);
    };

    const handleSendEmail = async () => {
        const success = await sendEmail(`zip:${result.downloadUrl}`, recipientEmail, {
            successMessage: 'Batch ZIP has been emailed successfully!',
            errorMessage: 'Failed to send batch email'
        });

        if (success) {
            setRecipientEmail('');
        }
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
                                onTemplateSelect={onTemplateSelect}
                                label="Select Template"
                                className="mb-0 flex-1 mr-4"
                            />
                            {selectedTemplate && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => showTemplatePreview(selectedTemplate)}
                                    className="mt-6 border border-border hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    Preview
                                </Button>
                            )}
                        </div>



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
                                    <div className="bg-gray-50 p-4 rounded-lg text-center border border-border">
                                        <div className="text-muted text-[10px] uppercase font-medium mb-1">Generated</div>
                                        <div className="text-2xl font-medium text-green-500">{result.generated}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center border border-border">
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
