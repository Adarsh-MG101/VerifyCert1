"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { verifyDocument } from '@/services/documentService';

export default function VerifyPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const verify = async () => {
            try {
                const resData = await verifyDocument(id);
                setData(resData);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Verification Failed');
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [id]);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center p-4 py-12">
                <Card className="w-full max-w-lg mb-8 animate-fade-in" title="Document Verification">
                    {loading && (
                        <div className="flex flex-col items-center py-10">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-primary/20"></div>
                            <div className="text-muted">Verifying authenticity...</div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-10">
                            <div className="text-6xl mb-4">❌</div>
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
                            <p className="text-muted">{error}</p>
                            <Link href="/">
                                <Button className="mt-6">Try Again</Button>
                            </Link>
                        </div>
                    )}

                    {data && (
                        <div>
                            <div className="text-center py-6 bg-green-50 rounded-lg mb-8 border border-green-200 shadow-sm">
                                <div className="text-5xl mb-2">✅</div>
                                <p className="font-bold text-green-700 text-xl font-header">Perfectly Authentic</p>
                                <p className="text-green-600/80 text-sm font-subtitle">Verified on Public Ledger</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-border pb-3">
                                    <span className="text-muted">Template</span>
                                    <span className="font-bold text-foreground">{data.templateName}</span>
                                </div>
                                <div className="flex justify-between border-b border-border pb-3">
                                    <span className="text-muted">Issued On</span>
                                    <span className="font-bold text-foreground">{new Date(data.issuedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </div>

                                <div className="mt-8 pt-4 border-t border-dashed border-border">
                                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Document Details</h3>
                                    <div className="space-y-4">
                                        {data.data && Object.entries(data.data).map(([key, value]) => {
                                            // Skip QR codes, metadata IDs, and complex objects that React can't render
                                            const isMetadata = ['QR', 'QRCODE', 'CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID', 'certificate_id'].includes(key.toUpperCase()) || key.includes(' ');
                                            const isObject = typeof value === 'object' && value !== null;

                                            if (isMetadata || isObject) return null;

                                            return (
                                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-border/50 pb-3 gap-1">
                                                    <span className="text-muted capitalize text-sm">{key.replace(/_/g, ' ')}</span>
                                                    <span className="font-bold text-foreground">{value.toString()}</span>
                                                </div>
                                            );
                                        })}
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
