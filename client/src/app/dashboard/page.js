"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Link from 'next/link';
import { getDashboardStats } from '@/services/dashboardService';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalTemplates: 0,
        documentsIssued: 0,
        pendingVerifications: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                if (err.message?.includes('401')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Templates', value: stats.totalTemplates, color: 'text-orange-400' },
        { title: 'Documents Issued', value: stats.documentsIssued, color: 'text-green-400' },
        { title: 'Pending Verifications', value: stats.pendingVerifications, color: 'text-yellow-400' },
    ];

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            {/* <h1 className="text-3xl font-bold mb-8 text-foreground">System Overview</h1> */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="flex flex-col items-center justify-center py-10 hover:border-primary/50 transition-all group">
                        <h3 className="text-muted text-[10px] uppercase tracking-[0.2em] mb-3 font-medium">{stat.title}</h3>
                        <p className={`text-5xl font-medium ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
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
                                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-all border border-border hover:border-primary/30 group"
                            >
                                <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">{action.icon}</span>
                                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{action.name}</span>
                                <span className="ml-auto text-muted group-hover:translate-x-1 transition-all">→</span>
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-4 flex items-center text-foreground">
                            <span className="bg-primary/20 p-2 rounded-lg mr-3 text-lg">💡</span>
                            Bulk Generation Tip
                        </h3>
                        <p className="text-muted text-sm mb-6 leading-relaxed">
                            Generate hundreds of certificates at once using CSV files! Upload your recipient data and our system will handle the rest.
                        </p>
                        <div className="space-y-3">
                            {[
                                'Upload CSV with recipient data',
                                'Auto-generate unique QR codes',
                                'Download all PDFs as ZIP',
                                'Track generation errors in real-time'
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start text-sm text-muted">
                                    <span className="text-primary mr-2 font-bold">✓</span>
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
