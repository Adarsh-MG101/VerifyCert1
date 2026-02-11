"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import DashboardHeader from '@/components/DashboardHeader';
import PageHeader from '@/components/PageHeader';
import { verifyToken, logout as logoutService } from '@/services/authService';
import { WebViewerProvider } from '@/context/WebViewerContext';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.replace('/login');
            return;
        }

        // Verify token with server to ensure it's still valid
        const verify = async () => {
            try {
                const data = await verifyToken();
                setUser(data.user);

                // If non-admin tries to access Overview, redirect to Templates
                if (data.user.role === 'user' && pathname === '/dashboard') {
                    router.replace('/dashboard/templates');
                    return; // Stay in loading state while redirecting
                }

                setLoading(false);
            } catch (err) {
                console.error('Session validation failed:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/login');
            }
        };

        verify();
    }, [router, pathname]);

    const handleLogout = async () => {
        try {
            await logoutService();
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
        <WebViewerProvider>
            <div className="flex h-screen overflow-hidden bg-background text-foreground transition-all duration-300">
                <aside className={`${isCollapsed ? 'w-20' : 'w-72'} border-r border-border p-4 flex flex-col bg-card z-30 shrink-0 h-full transition-all duration-300`}>
                    <div className={`flex items-center justify-between mb-12 ${isCollapsed ? 'flex-col gap-4' : ''}`}>
                        <Link href={user?.role === 'admin' ? "/dashboard" : "/dashboard/templates"} className="overflow-hidden transition-all duration-300">
                            <h2 className="text-3xl font-bold text-primary tracking-tight font-header whitespace-nowrap">
                                {isCollapsed ? 'V' : 'VerifyCert'}
                            </h2>
                        </Link>

                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors ${isCollapsed ? 'mt-2' : ''}`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="3" y1="5" x2="21" y2="5"></line>
                                <line x1="3" y1="10" x2="16" y2="10"></line>
                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                <line x1="3" y1="20" x2="16" y2="20"></line>
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
                        {navItems
                            .filter(item => !item.adminOnly || user?.role === 'admin')
                            .map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center p-3 rounded-lg transition-all group ${isActive(item.path)
                                        ? 'bg-primary/10 text-primary font-normal shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                                    title={isCollapsed ? item.name : ''}
                                >
                                    <span className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`text-sm font-normal tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            ))}
                    </nav>

                    <div className="mt-auto space-y-4 pt-4 border-t border-border">
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group border border-transparent hover:border-red-100 active:scale-[0.98] ${isCollapsed ? 'justify-center gap-0 px-0' : 'gap-3'}`}
                            title={isCollapsed ? 'Sign Out' : ''}
                        >
                            <span className="transition-transform group-hover:scale-110 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </span>
                            <span className={`text-xs font-normal tracking-tight uppercase whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                Sign Out
                            </span>
                        </button>

                        {!isCollapsed && (
                            <div className="opacity-50">
                                <div className="text-[10px] text-gray-400 text-center font-medium uppercase tracking-widest whitespace-nowrap">
                                    v1.0.0 &copy; VerifyCert
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
                    <div className="min-h-full flex flex-col">
                        <DashboardHeader user={user} />
                        <div className="flex-1 px-8 pt-4 pb-8">
                            <PageHeader />
                            {children}
                        </div>
                        <Footer />
                    </div>
                </main>
            </div>
        </WebViewerProvider>
    );
}
