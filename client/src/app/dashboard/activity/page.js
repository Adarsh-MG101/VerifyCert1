"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';

export default function ActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchActivity();
    }, []);

    const fetchActivity = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/auth/activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setActivities(data.activities);
            }
        } catch (err) {
            console.error('Error fetching activity:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10 text-white">
            <h1 className="text-3xl font-bold mb-8 uppercase tracking-tighter">Security & Activity Log</h1>

            <div className="grid grid-cols-1 gap-8 items-start">
                <Card title="Current Session" subtitle="Details about your active login session">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                        <div className="flex flex-col space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Current IP Address</label>
                            <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold font-mono">
                                {activities[0]?.ipAddress || 'Detecting...'}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Session Started At</label>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-medium">
                                {activities[0] ? formatDate(activities[0].timestamp) : 'Loading...'}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Device Information</label>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-medium truncate text-xs">
                                {activities[0]?.userAgent || 'Unknown Device'}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Login History" subtitle="List of your most recent login attempts and session data">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Event Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">IP Address</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-500 font-medium animate-pulse">
                                            Retrieving log history...
                                        </td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-500 font-medium">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((log, index) => (
                                        <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></span>
                                                    <span className="text-sm font-bold text-white capitalize">{log.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-300">
                                                    {formatDate(log.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono text-gray-400">
                                                    {log.ipAddress}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter ${index === 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {index === 0 ? 'Active Now' : 'Expired'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
