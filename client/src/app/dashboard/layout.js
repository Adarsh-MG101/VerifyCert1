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

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Logout error:', err);
        }
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
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <aside className="w-72 border-r border-border p-4 flex flex-col bg-card z-30 shrink-0 h-full">
                <Link href={user?.role === 'admin' ? "/dashboard" : "/dashboard/templates"}>
                    <h2 className="text-3xl font-bold text-primary mb-12 flex items-center font-header">
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
                                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium tracking-tight">{item.name}</span>
                            </Link>
                        ))}
                </nav>

                <div className="mt-auto space-y-4 pt-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group border border-transparent hover:border-red-100 active:scale-[0.98]"
                    >
                        <span className="transition-transform group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </span>
                        <span className="text-xs font-medium tracking-tight uppercase">Sign Out</span>
                    </button>

                    <div className="opacity-50">
                        <div className="text-[10px] text-gray-400 text-center font-medium uppercase tracking-widest">
                            v1.0.0 &copy; VerifyCert
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
                <div className="min-h-full flex flex-col">
                    <DashboardHeader user={user} />
                    <div className="flex-1 p-8">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-[10px] uppercase font-medium tracking-wider mb-6">
                            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                Home
                            </Link>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            <div className="flex items-center gap-1.5 text-primary/60">
                                {(() => {
                                    const path = pathname.split('/').filter(Boolean);
                                    const lastSegment = path[path.length - 1] || 'dashboard';

                                    const config = {
                                        'dashboard': { label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
                                        'templates': { label: 'Upload Template', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> },
                                        'existing-templates': { label: 'Template Library', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> },
                                        'generate': { label: 'Generate Certificate', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> },
                                        'bulk-generate': { label: 'Bulk Generate', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> },
                                        'documents': { label: 'Generated PDFs', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> },
                                        'settings': { label: 'Account Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg> },
                                        'profile': { label: 'Personal Info', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
                                        'activity': { label: 'User Activity', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
                                        'security': { label: 'Security & 2FA', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> }
                                    };

                                    const page = config[lastSegment] || config['dashboard'];
                                    return (
                                        <>
                                            <span className="opacity-70">{page.icon}</span>
                                            {page.label}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        {children}
                    </div>
                    <Footer />
                </div>
            </main>
        </div>
    );
}
