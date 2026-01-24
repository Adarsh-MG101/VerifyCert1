"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/Card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function VerifyPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verify/${id}`)
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
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center p-4 py-12">
                <Card className="w-full max-w-lg mb-8 animate-fade-in" title="Document Verification">
                    {loading && (
                        <div className="flex flex-col items-center py-10">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <div className="text-gray-400">Verifying authenticity...</div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-10">
                            <div className="text-6xl mb-4">❌</div>
                            <h2 className="text-2xl font-bold text-red-500 mb-2">Verification Failed</h2>
                            <p className="text-gray-400">{error}</p>
                            <Link href="/">
                                <button className="btn mt-6">Try Again</button>
                            </Link>
                        </div>
                    )}

                    {data && (
                        <div>
                            <div className="text-center py-6 bg-green-500/10 rounded-2xl mb-8 border border-green-500/20">
                                <div className="text-5xl mb-2">✅</div>
                                <p className="font-bold text-green-400 text-xl">Perfectly Authentic</p>
                                <p className="text-green-500/60 text-sm">Verified on Public Ledger</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-glass-border pb-3">
                                    <span className="text-gray-400">Template</span>
                                    <span className="font-medium">{data.templateName}</span>
                                </div>
                                <div className="flex justify-between border-b border-glass-border pb-3">
                                    <span className="text-gray-400">Issued On</span>
                                    <span className="font-medium">{new Date(data.issuedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </div>

                                <div className="mt-8 pt-4 border-t border-dashed border-glass-border">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Document Details</h3>
                                    <div className="space-y-4">
                                        {data.data && Object.entries(data.data).map(([key, value]) => (
                                            key !== 'document_id' && key !== 'qr_code' && (
                                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-glass-border/50 pb-3 gap-1">
                                                    <span className="text-gray-500 capitalize text-sm">{key.replace(/_/g, ' ')}</span>
                                                    <span className="font-semibold">{value}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </main>
            <Footer />
        </div>
    );
}
