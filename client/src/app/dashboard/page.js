"use client";
import { useState, useEffect } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalTemplates: 0,
        documentsIssued: 0,
        pendingVerifications: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/stats', {
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

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-gray-400 mb-2">Total Templates</h3>
                    <p className="text-4xl font-bold">{loading ? '...' : stats.totalTemplates}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-400 mb-2">Documents Issued</h3>
                    <p className="text-4xl font-bold">{loading ? '...' : stats.documentsIssued}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-400 mb-2">Pending Verifications</h3>
                    <p className="text-4xl font-bold">{loading ? '...' : stats.pendingVerifications}</p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-xl font-semibold mb-4 gradient-text">Quick Actions</h3>
                    <div className="space-y-3">
                        <a href="/dashboard/templates" className="block p-3 bg-slate-800 rounded hover:bg-slate-700 transition">
                            📄 Manage Templates
                        </a>
                        <a href="/dashboard/generate" className="block p-3 bg-slate-800 rounded hover:bg-slate-700 transition">
                            ✨ Generate Single Certificate
                        </a>
                        <a href="/dashboard/bulk-generate" className="block p-3 bg-slate-800 rounded hover:bg-slate-700 transition">
                            🚀 Bulk Generate from CSV
                        </a>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
                    <h3 className="text-xl font-semibold mb-4">💡 Bulk Generation</h3>
                    <p className="text-gray-300 text-sm mb-3">
                        Generate hundreds of certificates at once using CSV files!
                    </p>
                    <ul className="text-sm text-gray-400 space-y-2">
                        <li>✓ Upload CSV with recipient data</li>
                        <li>✓ Auto-generate unique QR codes</li>
                        <li>✓ Download all PDFs as ZIP</li>
                        <li>✓ Track generation errors</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
