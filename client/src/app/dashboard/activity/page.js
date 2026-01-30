"use client";
import Card from '@/components/Card';

export default function ActivityPage() {
    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10 text-white">
            <h1 className="text-3xl font-bold mb-8">User Activity</h1>

            <div className="grid grid-cols-1 gap-8 items-start">
                <Card title="Activity Analytics" subtitle="Track your behavioral patterns and session history">
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                        <div className="text-5xl mb-4">📊</div>
                        <p className="text-sm font-medium">Activity logging is being initialized...</p>
                        <p className="text-[10px] uppercase tracking-widest mt-2">Real-time tracking coming soon</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
