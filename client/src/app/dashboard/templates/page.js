"use client";
import { useState } from 'react';
import { useUI } from '@/context/UIContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FileUpload from '@/components/FileUpload';
import mammoth from 'mammoth';
import Link from 'next/link';
import { uploadTemplate } from '@/services/TemplateLib';

export default function TemplatesPage() {
    const { showAlert } = useUI();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showBuffer, setShowBuffer] = useState(false);
    const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);
    const [duplicatePlaceholders, setDuplicatePlaceholders] = useState([]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setDetectedPlaceholders([]);
        setDuplicatePlaceholders([]);

        if (selectedFile) {
            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                const text = result.value;

                // Match all placeholders {{...}}
                const allMatches = [];
                const regex = /\{\{(.*?)\}\}/g;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    allMatches.push(match[1].trim());
                }

                // Filter for strictly uppercase only
                const uppercasePlaceholders = allMatches.filter(p => p !== "" && /^[A-Z0-9_]+$/.test(p));

                // Find duplicates
                const seen = new Set();
                const duplicates = new Set();
                uppercasePlaceholders.forEach(p => {
                    if (seen.has(p)) duplicates.add(p);
                    seen.add(p);
                });

                // Unique list for display
                const uniqueDisplay = Array.from(new Set(uppercasePlaceholders))
                    .filter(p => p !== 'QR' && p !== 'QRCODE' && p !== 'CERTIFICATE_ID');

                setDetectedPlaceholders(uniqueDisplay);
                setDuplicatePlaceholders(Array.from(duplicates));

            } catch (err) {
                console.error("Error analyzing file:", err);
            }
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadTemplate(formData);
            if (res.ok) {
                setFile(null);
                setDetectedPlaceholders([]);
                setDuplicatePlaceholders([]);
                e.target.reset();

                setShowBuffer(true);
                setTimeout(() => {
                    setShowBuffer(false);
                    // Redirect to library after analysis
                    window.location.href = '/dashboard/existing-templates';
                }, 1500);
            } else {
                const data = await res.json();
                showAlert('Upload Failed', data.error || 'Check your template format', 'error');
            }
        } catch (err) {
            console.error(err);
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
                        <div className="mb-10 p-8 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                            <h4 className="text-xl font-bold text-primary flex items-center uppercase tracking-wider">
                                <span className="mr-3 text-2xl">📝</span> Template Guidelines
                            </h4>
                            <ul className="text-base text-foreground space-y-3 ml-10 list-disc leading-relaxed font-medium">
                                <li>All placeholders must be <span className="text-foreground font-medium">ALL CAPS</span> (e.g., <code className="text-primary font-mono font-medium bg-primary/10 px-1.5 py-0.5 rounded">{"{{NAME}}"}</code>).</li>
                                <li>Use <code className="text-primary font-mono font-medium bg-primary/10 px-1.5 py-0.5 rounded">{"{{QR}}"}</code> to position the verification QR code.</li>
                                <li>Lowercase tags like <code className="text-muted italic">{"{{Name}}"}</code> will <span className="text-red-600 font-medium uppercase">not</span> be detected.</li>
                            </ul>
                        </div>

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
