"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FileUpload from '@/components/FileUpload';
import mammoth from 'mammoth';



export default function TemplatesPage() {
    const [file, setFile] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showBuffer, setShowBuffer] = useState(false);
    const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);
    const [duplicatePlaceholders, setDuplicatePlaceholders] = useState([]);


    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchTemplates = () => {
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
                if (Array.isArray(data)) {
                    setTemplates(data);
                } else if (data) {
                    console.error('Expected array of templates, got:', data);
                    setTemplates([]);
                }
            })
            .catch(err => {
                console.error('Error fetching templates:', err);
                setTemplates([]);
            });
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

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

                // Filter for strictly uppercase only (our system requirement)
                const uppercasePlaceholders = allMatches.filter(p => p !== "" && /^[A-Z0-9_]+$/.test(p));

                // Find duplicates
                const seen = new Set();
                const duplicates = new Set();
                uppercasePlaceholders.forEach(p => {
                    if (seen.has(p)) {
                        duplicates.add(p);
                    }
                    seen.add(p);
                });

                // Unique list for display (excluding system tags)
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

        // Final check before upload
        const token = localStorage.getItem('token');
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);


        try {
            const res = await fetch(`${API_URL}/api/templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                setFile(null);
                setDetectedPlaceholders([]);
                setDuplicatePlaceholders([]);
                // Clear the form visually
                e.target.reset();


                // Show buffer for 1 second as requested
                setShowBuffer(true);
                setTimeout(() => {
                    setShowBuffer(false);
                    fetchTemplates();
                }, 1000);
            } else {
                const data = await res.json();
                alert(data.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleEditName = async (id, currentName) => {
        const newName = prompt('Enter new template name:', currentName);
        if (!newName || newName === currentName) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/templates/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                fetchTemplates();
            } else {
                const data = await res.json();
                alert(data.error || 'Update failed');
            }
        } catch (err) {
            console.error('Error updating template name:', err);
        }
    };

    const handleDelete = async (id) => {

        if (!confirm('Delete this template?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchTemplates();
            } else {
                alert('Delete failed');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Upload Template</h1>

            <Card
                // title="Upload New Template"
                // subtitle="Upload a Word (.docx) file with {{PLACEHOLDER}} to create a new template"
                className="mb-10"
            >
                {loading || showBuffer ? (
                    <div className="flex flex-col items-center justify-center py-8 animate-pulse text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-primary/20"></div>
                        <p className="text-primary font-medium">
                            {loading ? 'Uploading & Analyzing Template...' : 'Finalizing structure...'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                            <h4 className="text-sm font-bold text-primary flex items-center">
                                <span className="mr-2">📝</span> Template Guidelines
                            </h4>
                            <ul className="text-xs text-gray-400 space-y-1 ml-6 list-disc">
                                <li>All placeholders must be <span className="text-white font-bold">ALL CAPS</span> (e.g., <code className="text-primary font-mono font-bold">{"{{NAME}}"}</code>, <code className="text-primary font-mono font-bold">{"{{DATE}}"}</code>).</li>
                                <li>Use <code className="text-primary font-mono font-bold">{"{{QR}}"}</code> or <code className="text-primary font-mono font-bold">{"{{QRCODE}}"}</code> to position the verification QR code.</li>
                                <li>Use <code className="text-primary font-mono font-bold">{"{{CERTIFICATE_ID}}"}</code> to display the unique document identifier.</li>
                                <li>Lowercase or mixed-case tags like <code className="opacity-60 italic">{"{{Name}}"}</code> will <span className="text-red-400/80 font-bold uppercase">not</span> be detected.</li>
                            </ul>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-6">


                            <div className="flex-1 w-full">
                                <FileUpload
                                    file={file}
                                    onFileChange={handleFileChange}
                                    accept=".docx"
                                    placeholder="Click or drag .docx template"
                                    helperText="Word document with {{placeholders}}"
                                />
                            </div>

                            {file && (
                                <div className="space-y-4 animate-fade-in">
                                    {detectedPlaceholders.length > 0 ? (
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Detected Placeholders</div>
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
                                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider text-center">⚠️ Make sure all placeholders are capital</p>
                                        </div>

                                    )}

                                    {duplicatePlaceholders.length > 0 && (
                                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
                                            <p className="text-xs text-yellow-400 font-bold mb-1 italic">⚠️ Warning: Duplicate tags detected</p>
                                            <p className="text-[10px] text-yellow-400/80">
                                                The following placeholders appear multiple times: {duplicatePlaceholders.join(', ')}.
                                                This is fine, all instances will be filled with the same value.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}


                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={!file || loading || detectedPlaceholders.length === 0}
                                    className="w-full md:w-auto px-10 py-4"
                                >
                                    {loading ? 'Uploading...' : 'Upload Template'}
                                </Button>

                            </div>

                        </form>
                    </div>
                )}

            </Card>

            <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="bg-white/5 p-2 rounded-lg mr-3 text-sm">📂</span>
                Existing Templates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(templates) && templates.map(t => (
                    <Card key={t._id} className="hover:border-primary/30 transition-all group overflow-hidden flex flex-col h-full">
                        {/* Thumbnail Preview */}
                        <div className="relative aspect-[1.414/1] w-full bg-slate-800/50 mb-4 rounded-lg overflow-hidden border border-glass-border">
                            {t.thumbnailPath ? (
                                <img
                                    src={`${API_URL}/${t.thumbnailPath}`}
                                    alt={t.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                    <span className="text-4xl mb-2">📄</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">No Preview</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-[10px] text-white/70 font-medium">Click generate to use this template</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{t.name}</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEditName(t._id, t.name)}
                                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                                    title="Edit Name"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9"></path>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(t._id)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                    title="Delete Template"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>


                        </div>

                        <div className="mb-6 flex-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Placeholders Detected</span>
                            <div className="flex flex-wrap gap-2">
                                {t.placeholders.slice(0, 4).map(p => (
                                    <span key={p} className="bg-primary/10 text-[9px] px-2 py-0.5 rounded-md text-primary font-mono border border-primary/20">
                                        {p}
                                    </span>
                                ))}
                                {t.placeholders.length > 4 && (
                                    <span className="text-[9px] text-gray-500 self-center">+{t.placeholders.length - 4} more</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-glass-border flex items-center justify-between mt-auto">
                            <span className="text-[10px] text-gray-500 font-mono italic">
                                {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </Card>
                ))}

                {templates.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-glass-border rounded-3xl">
                        <p className="text-gray-500 mb-4 text-lg">No templates found in your library.</p>
                        <p className="text-sm text-gray-600">Upload your first .docx template above to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
