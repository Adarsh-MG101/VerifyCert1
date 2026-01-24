"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalTemplates: 0,
        documentsIssued: 0,
        pendingVerifications: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const statCards = [
        { title: 'Total Templates', value: stats.totalTemplates, color: 'text-blue-400' },
        { title: 'Documents Issued', value: stats.documentsIssued, color: 'text-green-400' },
        { title: 'Pending Verifications', value: stats.pendingVerifications, color: 'text-purple-400' },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-8">System Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="flex flex-col items-center justify-center py-10 hover:border-primary/50 transition-colors">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2 font-medium">{stat.title}</h3>
                        <p className={`text-5xl font-bold ${stat.color}`}>
                            {loading ? <span className="animate-pulse">...</span> : stat.value}
                        </p>
                    </Card>
                ))}
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Quick Actions" subtitle="Frequently used administrative tools">
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        {[
                            { name: 'Manage Templates', path: '/dashboard/templates', icon: '📄' },
                            { name: 'Generate Single Certificate', path: '/dashboard/generate', icon: '✨' },
                            { name: 'Bulk Generate from CSV', path: '/dashboard/bulk-generate', icon: '🚀' },
                        ].map((action) => (
                            <Link
                                key={action.path}
                                href={action.path}
                                className="flex items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group"
                            >
                                <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">{action.icon}</span>
                                <span className="font-medium">{action.name}</span>
                                <span className="ml-auto text-gray-500 group-hover:text-white transition-colors">→</span>
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <span className="bg-primary/20 p-2 rounded-lg mr-3 text-lg">💡</span>
                            Bulk Generation Tip
                        </h3>
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                            Generate hundreds of certificates at once using CSV files! Upload your recipient data and our system will handle the rest.
                        </p>
                        <div className="space-y-3">
                            {[
                                'Upload CSV with recipient data',
                                'Auto-generate unique QR codes',
                                'Download all PDFs as ZIP',
                                'Track generation errors in real-time'
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start text-sm text-gray-400">
                                    <span className="text-primary mr-2">✓</span>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
