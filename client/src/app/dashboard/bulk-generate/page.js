"use client";
import { useState, useEffect } from 'react';

export default function BulkGeneratePage() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [qrX, setQrX] = useState(50);
    const [qrY, setQrY] = useState(50);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/templates', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => setTemplates(data))
            .catch(console.error);
    }, []);

    const handleTemplateSelect = (e) => {
        const tId = e.target.value;
        const t = templates.find(x => x._id === tId);
        setSelectedTemplate(t);
        setResult(null);
    };

    const handleFileChange = (e) => {
        setCsvFile(e.target.files[0]);
        setResult(null);
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
            const res = await fetch('http://localhost:5000/api/generate-bulk', {
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
        <div>
            <h1 className="text-3xl font-bold mb-6">Bulk Generate Documents</h1>

            <div className="card max-w-2xl">
                <div className="mb-6">
                    <label className="block text-gray-400 mb-2">Select Template</label>
                    <select className="input bg-slate-800" onChange={handleTemplateSelect}>
                        <option value="">-- Choose Template --</option>
                        {templates.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {selectedTemplate && (
                    <form onSubmit={handleGenerate}>
                        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                            <h3 className="font-semibold mb-2 text-blue-400">CSV Format Instructions</h3>
                            <p className="text-sm text-gray-300 mb-3">
                                Your CSV file should have the following columns as headers:
                            </p>
                            <div className="bg-black/30 p-3 rounded font-mono text-sm mb-3">
                                {selectedTemplate.placeholders
                                    .filter(p => p !== 'certificate_id' && p !== 'qr_code')
                                    .join(', ') || 'No placeholders in this template'}
                            </div>
                            <button
                                type="button"
                                onClick={downloadSampleCSV}
                                className="btn btn-outline text-sm"
                            >
                                Download Sample CSV
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-400 mb-2">Upload CSV File</label>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="input"
                                required
                            />
                            {csvFile && (
                                <p className="text-sm text-green-400 mt-2">
                                    ✓ Selected: {csvFile.name}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">QR Code X Position</label>
                                <input
                                    type="number"
                                    className="input mb-0"
                                    value={qrX}
                                    onChange={(e) => setQrX(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">QR Code Y Position</label>
                                <input
                                    type="number"
                                    className="input mb-0"
                                    value={qrY}
                                    onChange={(e) => setQrY(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn w-full" disabled={generating}>
                            {generating ? 'Generating PDFs...' : 'Generate All PDFs'}
                        </button>
                    </form>
                )}
            </div>

            {result && (
                <div className="mt-8 p-6 bg-green-900/20 border border-green-500/50 rounded-xl animate-fade-in">
                    <h3 className="text-green-400 font-bold text-xl mb-4">Bulk Generation Complete!</h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-black/30 p-4 rounded">
                            <p className="text-gray-400 text-sm">Total Rows</p>
                            <p className="text-2xl font-bold">{result.totalRows}</p>
                        </div>
                        <div className="bg-green-900/30 p-4 rounded">
                            <p className="text-gray-400 text-sm">Generated</p>
                            <p className="text-2xl font-bold text-green-400">{result.generated}</p>
                        </div>
                        <div className="bg-red-900/30 p-4 rounded">
                            <p className="text-gray-400 text-sm">Failed</p>
                            <p className="text-2xl font-bold text-red-400">{result.failed}</p>
                        </div>
                    </div>

                    {result.errors && result.errors.length > 0 && (
                        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded">
                            <h4 className="text-red-400 font-semibold mb-2">Errors:</h4>
                            <ul className="text-sm space-y-1">
                                {result.errors.map((err, idx) => (
                                    <li key={idx}>Row {err.row}: {err.error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <a
                        href={`http://localhost:5000${result.downloadUrl}`}
                        className="btn bg-green-600 w-full"
                        download
                    >
                        Download ZIP ({result.generated} PDFs)
                    </a>
                </div>
            )}
        </div>
    );
}
