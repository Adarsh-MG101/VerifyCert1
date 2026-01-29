"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Link from 'next/link';
import TemplateSelector from '@/components/TemplateSelector';
import TemplatePreview from '@/components/TemplatePreview';


export default function GeneratePage() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [generatedDoc, setGeneratedDoc] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [sending, setSending] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const searchParams = useSearchParams();
    const templateIdParam = searchParams.get('templateId');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_URL}/api/templates`, {
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
            })
            .catch(err => {
                console.error('Error fetching templates:', err);
                setTemplates([]);
            });
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

        const token = localStorage.getItem('token');
        setGenerating(true);
        try {
            const res = await fetch(`${API_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    templateId: selectedTemplate._id,
                    data: formData
                })
            });
            const result = await res.json();
            if (res.ok) {
                setGeneratedDoc(result);
            } else {
                alert(result.error || 'Generation Failed');
            }
        } catch (err) {
            console.error(err);
        }
        setGenerating(false);
    };

    const handleSendEmail = async () => {
        if (!recipientEmail || !generatedDoc) return;

        setSending(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    documentId: generatedDoc.document._id,
                    recipientEmail: recipientEmail
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Success: Certificate has been emailed!');
                setRecipientEmail('');
            } else {
                alert(data.error || 'Failed to send email');
            }
        } catch (err) {
            console.error(err);
            alert('Error sending email');
        }
        setSending(false);
    };

    const isFormComplete = () => {
        if (!selectedTemplate) return false;
        const requiredFields = selectedTemplate.placeholders.filter(p => p !== 'certificate_id' && p !== 'qr_code');
        return requiredFields.every(field => formData[field] && formData[field].trim() !== "");
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Generate Certificate</h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <Card title="Document Details" subtitle="Select a template and fill in the required data">
                        <TemplateSelector
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onTemplateSelect={handleTemplateSelect}
                        />

                        <TemplatePreview
                            template={selectedTemplate}
                            maxWidth="300px"
                            className="mb-8"
                            overlayText="Ready to generate"
                        />


                        {selectedTemplate && (
                            <form onSubmit={handleGenerate} className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-glass-border pb-2">Variables Found</h3>

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
                                        <div className="py-4 text-center bg-white/5 rounded-xl border border-white/5 text-gray-500 italic">
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
                    <Card title="Guide" className="bg-white/5">
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                            Fill in all the required fields. The data will be automatically inserted into your Word template and converted to PDF.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center text-xs text-gray-500">
                                <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center mr-2 font-bold">1</span>
                                Select your pre-uploaded template.
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center mr-2 font-bold">2</span>
                                Fill in recipient specific details.
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center mr-2 font-bold">3</span>
                                Add any image to your doc and set its Alt Text to {"{{qr}}"} for exact positioning.
                            </div>
                        </div>
                    </Card>

                    {generatedDoc && (
                        <Card className="border-green-500/30 bg-green-500/5 animate-fade-in" title="Success!">
                            <div className="space-y-5">
                                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Document ID</span>
                                    <span className="font-mono text-sm break-all">{generatedDoc.document.uniqueId}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <a href={`${API_URL}${generatedDoc.downloadUrl}`} target="_blank" rel="noopener noreferrer">
                                        <Button className="w-full bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-900/20">
                                            📥 Download PDF
                                        </Button>
                                    </a>
                                </div>

                                <div className="pt-4 border-t border-white/10 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Certificate</h4>
                                    <Input
                                        type="email"
                                        placeholder="recipient@example.com"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        className="bg-black/20"
                                    />
                                    <Button
                                        onClick={handleSendEmail}
                                        className="w-full text-sm"
                                        disabled={!recipientEmail || sending}
                                    >
                                        {sending ? 'Sending...' : '📧 Send via Email'}
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
