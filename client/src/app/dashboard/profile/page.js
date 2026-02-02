"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';

export default function ProfilePage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10 text-white">
            {/* <h1 className="text-3xl font-bold mb-8">Personal Info</h1> */}

            <div className="grid grid-cols-1 gap-8 items-start">
                <Card title="Account Profile" subtitle="General information about your account">
                    <div className="space-y-6">
                        <div className="flex flex-col space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                                {user?.name || 'Loading...'}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                                {user?.email || 'Loading...'}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Role</label>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium uppercase text-xs">
                                {user?.role || 'User'}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
