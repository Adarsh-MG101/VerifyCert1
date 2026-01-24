"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token) {
            router.replace('/login');
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

    const isActive = (path) => pathname === path;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl gradient-text animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 border-r border-glass-border p-6 flex flex-col bg-slate-900/50 backdrop-blur-md">
                <Link href="/dashboard">
                    <h2 className="text-2xl font-bold gradient-text mb-10 flex items-center">
                        VerifyCert
                        {/* <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded ml-2 uppercase tracking-wider">Admin</span> */}
                    </h2>
                </Link>

                <nav className="flex-1 space-y-2">
                    {[
                        { name: 'Overview', path: '/dashboard' },
                        { name: 'Templates', path: '/dashboard/templates' },
                        { name: 'Generate Single', path: '/dashboard/generate' },
                        { name: 'Bulk Generate', path: '/dashboard/bulk-generate' },
                    ].map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`block p-3 rounded-lg transition-all ${isActive(item.path)
                                ? 'bg-primary/20 text-white font-medium border border-primary/30'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto pt-10">
                    <Button onClick={handleLogout} variant="outline" className="w-full text-sm text-white border-white/20 hover:bg-white/5">Logout</Button>
                    <div className="mt-4 text-[10px] text-gray-500 text-center uppercase tracking-widest">
                        Logged in as <br /> <span className="text-gray-300 normal-case tracking-normal">{user?.email}</span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto bg-slate-900/20">
                {children}
            </main>
        </div>
    );
}
