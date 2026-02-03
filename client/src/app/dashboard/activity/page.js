"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import DisplayField from '@/components/DisplayField';
import { getUserActivity } from '@/services/dashboardService';

export default function ActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
    }, []);
    const fetchActivity = async () => {
        try {
            const data = await getUserActivity();
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

    const calculateDuration = (start, end) => {
        if (!end) return null;
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* <h1 className="text-3xl font-bold mb-8 uppercase tracking-tighter">Security & Activity Log</h1> */}

            <div className="grid grid-cols-1 gap-8 items-start">
                <Card title="Current Session" subtitle="Details about your active login session">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                        <DisplayField
                            label="Current IP Address"
                            value={activities[0]?.ipAddress || 'Detecting...'}
                            variant="primary"
                        />
                        <DisplayField
                            label="Session Started At"
                            value={activities[0] ? formatDate(activities[0].timestamp) : 'Loading...'}
                        />
                        <DisplayField
                            label="Device Information"
                            value={activities[0]?.userAgent || 'Unknown Device'}
                        />
                    </div>
                </Card>

                <Card title="Login History" subtitle="List of your most recent login attempts and session data">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-gray-50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Login Time</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Session End</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Duration</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-muted uppercase tracking-widest">IP Address</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-muted uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-gray-500 font-medium animate-pulse">
                                            Retrieving log history...
                                        </td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-gray-500 font-medium">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((log, index) => (
                                        <tr key={log._id} className="border-b border-border hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                {log.endedAt ? formatDate(log.endedAt) : (index === 0 ? 'Ongoing' : '-')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-primary">
                                                {calculateDuration(log.timestamp, log.endedAt) || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-muted">
                                                {log.ipAddress}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter ${index === 0 && !log.endedAt ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                                    {index === 0 && !log.endedAt ? 'Ongoing' : 'Expired'}
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
