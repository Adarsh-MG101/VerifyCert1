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
        {
            name: 'Overview',
            path: '/dashboard',
            adminOnly: true,
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        },
        {
            name: 'Upload Template',
            path: '/dashboard/templates',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        },
        {
            name: 'Template Library',
            path: '/dashboard/existing-templates',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        },
        {
            name: 'Generate Certificate',
            path: '/dashboard/generate',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        },
        {
            name: 'Generate Multiple',
            path: '/dashboard/bulk-generate',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
        },
        {
            name: 'Generated PDFs',
            path: '/dashboard/documents',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H9H8"></path></svg>
        },
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
            <aside className="w-72 border-r border-glass-border p-8 flex flex-col bg-black z-30 shrink-0 h-full">
                <Link href={user?.role === 'admin' ? "/dashboard" : "/dashboard/templates"}>
                    <h2 className="text-3xl font-bold gradient-text mb-12 flex items-center">
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
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${isActive(item.path)
                                    ? 'bg-primary/20 text-white font-bold border border-primary/30 shadow-lg shadow-primary/5'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive(item.path) ? 'text-primary' : 'text-gray-500'}`}>
                                    {item.icon}
                                </span>
                                <span className="text-base font-semibold tracking-tight">{item.name}</span>
                            </Link>
                        ))}
                </nav>

                <div className="mt-auto space-y-4 pt-4 border-t border-glass-border/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-red-600/90 text-white hover:bg-red-600 transition-all group shadow-lg shadow-red-900/20 active:scale-[0.98]"
                    >
                        <span className="transition-transform group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </span>
                        <span className="text-sm font-black tracking-tight uppercase">Sign Out</span>
                    </button>

                    <div className="opacity-30">
                        <div className="text-[8px] text-gray-400 text-center uppercase tracking-[0.2em]">
                            v1.0.0 &copy; VerifyCert
                        </div>
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
