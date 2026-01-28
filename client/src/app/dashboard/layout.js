"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import DashboardHeader from '@/components/DashboardHeader';

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
            return;
        }

        // Verify token with server to ensure it's still valid
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        fetch(`${API_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Session expired');
            })
            .then(data => {
                setUser(data.user);

                // If non-admin tries to access Overview, redirect to Templates
                if (data.user.role === 'user' && pathname === '/dashboard') {
                    router.replace('/dashboard/templates');
                    return; // Stay in loading state while redirecting
                }

                setLoading(false);
            })
            .catch(err => {
                console.error('Session validation failed:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/login');
            });
    }, [router, pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const isActive = (path) => pathname === path;

    const navItems = [
        { name: 'Overview', path: '/dashboard', adminOnly: true },
        { name: 'Upload Template', path: '/dashboard/templates' },
        { name: 'Template Library', path: '/dashboard/existing-templates' },
        { name: 'Generate Certificate', path: '/dashboard/generate' },
        { name: 'Generate Multiple', path: '/dashboard/bulk-generate' },
        { name: 'Generated PDFs', path: '/dashboard/documents' },


    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl gradient-text animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-black text-white">
            <aside className="w-64 border-r border-glass-border p-6 flex flex-col bg-black z-30 shrink-0 h-full">
                <Link href={user?.role === 'admin' ? "/dashboard" : "/dashboard/templates"}>
                    <h2 className="text-2xl font-bold gradient-text mb-10 flex items-center">
                        VerifyCert
                    </h2>
                </Link>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {navItems
                        .filter(item => !item.adminOnly || user?.role === 'admin')
                        .map((item) => (
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

                <div className="mt-auto pt-6 opacity-30">
                    <div className="text-[8px] text-gray-400 text-center uppercase tracking-[0.2em]">
                        v1.0.0 &copy; VerifyCert
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="min-h-full flex flex-col">
                    <DashboardHeader user={user} />
                    <div className="flex-1 p-8">
                        {children}
                    </div>
                    <Footer />
                </div>
            </main>
        </div>
    );
}
