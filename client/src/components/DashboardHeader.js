"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DashboardHeader = ({ user }) => {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <header className="w-full border-b border-glass-border bg-slate-900/10 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Welcome back,</span>
                    <span className="text-sm font-semibold text-white">{user?.name || user?.email}</span>
                </div>
                <div className="h-8 w-px bg-glass-border mx-2"></div>
                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] text-primary uppercase font-bold tracking-wider">
                    {user?.role || 'User'}
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <Link
                    href="/dashboard/change-password"
                    className="text-xs font-bold text-gray-400 hover:text-primary uppercase tracking-wider transition-colors"
                >
                    Change Password
                </Link>
                <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
