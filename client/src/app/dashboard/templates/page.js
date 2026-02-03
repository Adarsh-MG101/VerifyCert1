"use client";
import { useState } from 'react';
import { useUI } from '@/context/UIContext';
import {
    Card,
    Button,
    FileUpload,
    Guidelines
} from '@/components';
import mammoth from 'mammoth';
import Link from 'next/link';
import { uploadTemplate } from '@/services/TemplateLib';

import { useDocxTemplate } from '@/hooks';

export default function TemplatesPage() {
    const { showAlert } = useUI();
    const {
        file,
        setFile,
        detectedPlaceholders,
        duplicatePlaceholders,
        handleFileChange,
        resetFile
    } = useDocxTemplate();

    const [loading, setLoading] = useState(false);
    const [showBuffer, setShowBuffer] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await uploadTemplate(formData);
            resetFile();
            e.target.reset();

            setShowBuffer(true);
            setTimeout(() => {
                setShowBuffer(false);
                // Redirect to library after analysis
                window.location.href = '/dashboard/existing-templates';
            }, 1500);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Check your template format';
            showAlert('Upload Failed', errorMsg, 'error');
        }
        setLoading(false);
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Upload Template</h1>
                <Link href="/dashboard/existing-templates">
                    <Button variant="outline" className="text-sm">📂 View Library</Button>
                </Link>
            </div> */}

            <Card className="mb-10">
                {loading || showBuffer ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-primary/20"></div>
                        <p className="text-primary font-medium">
                            {loading ? 'Uploading & Analyzing Template...' : 'Template Analyzed! Redirecting to library...'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        <Guidelines
                            title="Template Guidelines"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>}
                            items={[
                                <>All placeholders must be <span className="text-foreground font-normal">ALL CAPS</span> (e.g., <code className="text-primary font-mono font-normal bg-primary/10 px-1.5 py-0.5 rounded">{"{{NAME}}"}</code>).</>,
                                <>Use <code className="text-primary font-mono font-normal bg-primary/10 px-1.5 py-0.5 rounded">{"{{QR}}"}</code> to position the verification QR code.</>,
                                <>Lowercase tags like <code className="text-muted italic">{"{{Name}}"}</code> will <span className="text-red-600 font-normal uppercase">not</span> be detected.</>
                            ]}
                        />

                        <form onSubmit={handleUpload} className="space-y-6">
                            <FileUpload
                                file={file}
                                onFileChange={handleFileChange}
                                accept=".docx"
                                placeholder="Click or drag .docx template"
                                helperText="Word document with {{placeholders}}"
                            />

                            {file && (
                                <div className="space-y-4 animate-fade-in">
                                    {detectedPlaceholders.length > 0 ? (
                                        <div className="bg-gray-50 border border-border p-4 rounded-xl">
                                            <div className="text-[10px] font-medium text-muted uppercase tracking-widest mb-3">Detected Placeholders</div>
                                            <div className="flex flex-wrap gap-2">
                                                {detectedPlaceholders.map(p => (
                                                    <span key={p} className="bg-primary/10 text-[10px] px-2.5 py-1 rounded-md text-primary font-mono border border-primary/20">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                                            <p className="text-xs text-red-400 font-medium uppercase tracking-wider text-center">⚠️ No valid uppercase placeholders detected</p>
                                        </div>
                                    )}

                                    {duplicatePlaceholders.length > 0 && (
                                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
                                            <p className="text-[10px] text-yellow-400/80">
                                                ⚠️ {duplicatePlaceholders.length} duplicate tags will be filled with same value.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={!file || loading || detectedPlaceholders.length === 0}
                                    className="w-full md:w-auto px-10 py-4"
                                >
                                    {loading ? 'Uploading...' : 'Confirm & Upload Template'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </Card>
        </div>
    );
}
