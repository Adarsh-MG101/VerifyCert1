"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../globals.css';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
        } else {
            setUser(JSON.parse(storedUser));
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl gradient-text animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 border-r border-gray-800 p-6 flex flex-col bg-slate-900">
                <h2 className="text-xl font-bold gradient-text mb-8">VerifyCert
                    <span className="text-xs text-white bg-blue-600 px-1 rounded ml-1"> Admin</span>
                </h2>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className="block p-3 rounded hover:bg-slate-800">Overview</Link>
                    <Link href="/dashboard/templates" className="block p-3 rounded hover:bg-slate-800">Templates</Link>
                    <Link href="/dashboard/generate" className="block p-3 rounded hover:bg-slate-800">Generate Single</Link>
                    <Link href="/dashboard/bulk-generate" className="block p-3 rounded hover:bg-slate-800">Bulk Generate</Link>
                </nav>

                <div className="mt-16 mb-10">
                    <button onClick={handleLogout} className="btn w-full text-sm">Logout</button>
                    <div className="mt-4 text-xs text-gray-500 text-center">
                        Logged in as: <br /> {user?.email}
                    </div>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
