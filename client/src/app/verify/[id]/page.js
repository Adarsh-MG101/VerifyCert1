"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        fetch(`http://localhost:5000/api/verify/${id}`)
            .then(res => res.json())
            .then(res => {
                if (res.valid) {
                    setData(res);
                } else {
                    setError(res.message || 'Invalid Document');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Verification Failed');
                setLoading(false);
            });
    }, [id]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white">&larr; Back</Link>

            <div className="card w-full max-w-lg mb-8 animate-fade-in">
                <h1 className="text-2xl font-bold mb-6 text-center">Document Verification</h1>

                {loading && <div className="text-center">Verifying...</div>}

                {error && (
                    <div className="text-center text-red-400">
                        <div className="text-4xl mb-2">❌</div>
                        <p>{error}</p>
                    </div>
                )}

                {data && (
                    <div>
                        <div className="text-center text-green-400 mb-6">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="font-bold">Valid Document</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span className="text-gray-400">Template</span>
                                <span>{data.templateName}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span className="text-gray-400">Issued At</span>
                                <span>{new Date(data.issuedAt).toLocaleDateString()}</span>
                            </div>

                            <h3 className="mt-6 font-semibold text-gray-300">Document Data</h3>
                            {data.data && Object.entries(data.data).map(([key, value]) => (
                                key !== 'document_id' && key !== 'qr_code' && (
                                    <div key={key} className="flex justify-between border-b border-gray-700 pb-2">
                                        <span className="text-gray-400 capitalize">{key}</span>
                                        <span>{value}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
