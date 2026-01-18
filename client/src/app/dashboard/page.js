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
        </div>
    );
}
