"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import DisplayField from '@/components/DisplayField';

export default function ProfilePage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-10">
            {/* <h1 className="text-3xl font-bold mb-8">Personal Info</h1> */}

            <div className="grid grid-cols-1 gap-8 items-start">
                <Card title="Account Profile" subtitle="General information about your account">
                    <div className="space-y-6">
                        <DisplayField
                            label="Full Name"
                            value={user?.name || 'Loading...'}
                        />

                        <DisplayField
                            label="Email Address"
                            value={user?.email || 'Loading...'}
                        />

                        <DisplayField
                            label="Role"
                            value={user?.role || 'User'}
                            variant="default"
                            className="capitalize"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
