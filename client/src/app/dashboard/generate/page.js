"use client";
import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Link from 'next/link';
import TemplateSelector from '@/components/TemplateSelector';
import TemplatePreview from '@/components/TemplatePreview';
import Modal from '@/components/Modal';
import { getTemplates } from '@/services/TemplateLib';
import { generateCertificate, sendCertificateEmail } from '@/services/documentService';
import { getApiUrl } from '@/services/apiService';


import { Suspense } from 'react';

function GenerateContent() {
    const { showAlert } = useUI();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [generatedDoc, setGeneratedDoc] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const searchParams = useSearchParams();
    const templateIdParam = searchParams.get('templateId');

    useEffect(() => {
        const fetchTemplatesList = async () => {
            try {
                const data = await getTemplates({ onlyEnabled: true, limit: 5000 });
                let fetchedTemplates = [];
                if (Array.isArray(data)) {
                    fetchedTemplates = data;
                } else if (data && Array.isArray(data.templates)) {
                    fetchedTemplates = data.templates;
                }

                setTemplates(fetchedTemplates);

                // Auto-select if parameter is present
                if (templateIdParam && fetchedTemplates.length > 0) {
                    const t = fetchedTemplates.find(x => x._id === templateIdParam);
                    if (t) {
                        setSelectedTemplate(t);
                    }
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
    }, [templateIdParam]);

    const handleTemplateSelect = (e) => {
        const tId = e.target.value;
        const t = templates.find(x => x._id === tId);
        setSelectedTemplate(t);
        setFormData({});
        setGeneratedDoc(null);
        setRecipientEmail('');
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        setGenerating(true);
        try {
            const data = await generateCertificate(selectedTemplate._id, formData);
            if (data.document) {
                setGeneratedDoc(data);
            } else {
                showAlert('Generation Failed', data.error || 'Check your template or data', 'error');
            }
        } catch (err) {
            console.error(err);
        }
        setGenerating(false);
    };

    const handleSendEmail = async () => {
        if (!recipientEmail || !generatedDoc) return;

        setSending(true);
        try {
            const data = await sendCertificateEmail(generatedDoc.document._id, recipientEmail);
            if (data.message) {
                showAlert('Success', 'Certificate has been emailed successfully!', 'info');
                setRecipientEmail('');
            } else {
                showAlert('Email Failed', data.error || 'Failed to send email', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'An unexpected error occurred', 'error');
        }
        setSending(false);
    };

    const isFormComplete = () => {
        if (!selectedTemplate) return false;
        const requiredFields = selectedTemplate.placeholders.filter(p => p !== 'certificate_id' && p !== 'qr_code');
        return requiredFields.every(field => formData[field] && formData[field].trim() !== "");
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* <h1 className="text-4xl font-bold mb-10">Generate Certificate</h1> */}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className={`${generatedDoc ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
                    <Card className="p-8">
                        <div className="mb-10 p-8 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                            <h4 className="text-xl font-bold text-primary flex items-center uppercase tracking-wider">
                                <span className="mr-3 text-2xl">✨</span> Generation Guidelines
                            </h4>
                            <ul className="text-sm text-foreground/80 space-y-4 ml-6 list-disc marker:text-primary leading-relaxed">
                                <li className="pl-2">Select a <span className="text-primary font-bold">Template</span> to automatically load its required variables.</li>
                                <li className="pl-2">Ensure all <span className="text-primary font-bold">Variables</span> are filled correctly; they are case-sensitive if specific formats are required.</li>
                                <li className="pl-2">The <span className="text-primary font-bold">Verification Footer</span> (QR & ID) will be automatically appended to the final PDF.</li>
                                <li className="pl-2">Click <span className="italic font-bold text-primary">"Generate Document"</span> to process the PDF conversion in real-time.</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <TemplateSelector
                                templates={templates}
                                selectedTemplate={selectedTemplate}
                                onTemplateSelect={handleTemplateSelect}
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
                                <h3 className="text-xs font-medium text-muted uppercase tracking-[0.2em] border-b border-border pb-3">Variables Found</h3>

                                <div className="grid grid-cols-1 gap-5">
                                    {selectedTemplate.placeholders && selectedTemplate.placeholders.filter(p => p !== 'certificate_id' && p !== 'qr_code').length > 0 ? (
                                        selectedTemplate.placeholders
                                            .filter(p => p !== 'certificate_id' && p !== 'qr_code')
                                            .map(key => (
                                                <Input
                                                    key={key}
                                                    label={key.replace(/_/g, ' ')}
                                                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                                    value={formData[key] || ''}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    required
                                                />
                                            ))
                                    ) : (
                                        <div className="py-4 text-center bg-gray-50 rounded-xl border border-border text-muted italic">
                                            No custom placeholders in this template.
                                        </div>
                                    )}
                                </div>


                                <Button
                                    type="submit"
                                    className="w-full py-4 text-lg mt-6"
                                    disabled={generating || !isFormComplete()}
                                >
                                    {generating ? (
                                        <span className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                            Generating PDF...
                                        </span>
                                    ) : 'Generate Document'}
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* Dynamic Status / Actions could go here */}

                    {generatedDoc && (
                        <Card className="border-green-500/30 bg-green-500/5 animate-fade-in" title="Success!">
                            <div className="space-y-5">
                                <div className="p-4 bg-gray-50 rounded-xl border border-border">
                                    <span className="text-[10px] text-muted uppercase font-medium block mb-1">Document ID</span>
                                    <span className="font-mono text-sm break-all text-foreground">{generatedDoc.document.uniqueId}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <a href={getApiUrl(generatedDoc.downloadUrl)} target="_blank" rel="noopener noreferrer">
                                        <Button className="w-full bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-900/20">
                                            📥 Download PDF
                                        </Button>
                                    </a>
                                </div>

                                <div className="pt-4 border-t border-border space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Email Certificate</h4>
                                    <Input
                                        type="email"
                                        placeholder="recipient@example.com"
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
                                            "Send via Email"
                                        )}
                                    </Button>
                                </div>

                                <div className="pt-2">
                                    <Link href={`/verify/${generatedDoc.document.uniqueId}`} target="_blank">
                                        <Button variant="outline" className="w-full text-xs opacity-60 hover:opacity-100">
                                            🔍 Public Verification Page
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GeneratePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <GenerateContent />
        </Suspense>
    );
}

