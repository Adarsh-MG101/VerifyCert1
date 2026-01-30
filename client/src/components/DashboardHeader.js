"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DashboardHeader = ({ user }) => {
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Dynamic breadcrumb logic
    const getPageDetails = () => {
        const path = pathname.split('/').filter(Boolean);
        const segments = {
            'dashboard': 'Dashboard',
            'templates': 'Upload Template',
            'existing-templates': 'Template Library',
            'generate': 'Generate Certificate',
            'bulk-generate': 'Bulk Generate',
            'documents': 'Generated PDFs',
            'change-password': 'Change Password',
            'profile': 'Personal Info',
            'activity': 'User Activity',
            'security': 'Security & 2FA'
        };

        const currentPath = path[path.length - 1];
        const pageTitle = segments[currentPath] || 'Dashboard';

        return { pageTitle };
    };

    const { pageTitle } = getPageDetails();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <header className="w-full border-b border-glass-border bg-slate-900/10 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-5">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">{pageTitle}</h2>
                    <div className="h-5 w-px bg-glass-border"></div>
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-400 hover:text-primary transition-colors font-medium">Home</Link>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        <span className="text-gray-500 font-medium">{pageTitle}</span>
                    </nav>
                </div>
            </div>

            <div className="flex items-center space-x-5">
                {/* Theme Toggle */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full border border-glass-border bg-white/5 hover:bg-white/10 transition-all text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>

                {/* Notifications */}
                <button className="relative w-10 h-10 flex items-center justify-center rounded-full border border-glass-border bg-white/5 hover:bg-white/10 transition-all text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span className="absolute top-0 right-0 w-3 h-3 bg-[#FF7043] border-2 border-[#1E293B] rounded-full"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="flex items-center gap-3 pl-2 group cursor-pointer"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-10 h-10 rounded-full border-2 border-glass-border overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold shadow-lg group-hover:border-primary/50 transition-all">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white tracking-tight group-hover:text-primary transition-colors">
                                {user?.name?.split(' ')[0] || 'User'}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`text-gray-500 group-hover:text-white transition-all ${isProfileOpen ? 'rotate-180' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-4 w-64 bg-[#0F172A] border border-glass-border rounded-2xl shadow-2xl backdrop-blur-2xl z-50 animate-fade-in py-2 overflow-hidden">
                            <div className="px-5 py-3 border-b border-glass-border">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-bold text-white truncate">{user?.name || 'Administrator'}</p>
                                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                            </div>

                            <div className="py-2">
                                <Link href="/dashboard/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </span>
                                    <span className="font-medium">Personal Info</span>
                                </Link>

                                <Link href="/dashboard/activity" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                    </span>
                                    <span className="font-medium">User Activity</span>
                                </Link>
                            </div>

                            <div className="py-2 border-t border-glass-border/50">
                                <Link href="/dashboard/security" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                                    <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="font-medium">Security & 2FA</span>
                                        <span className="text-[10px] text-gray-600">Enhanced protection</span>
                                    </div>
                                </Link>

                                <Link href="/dashboard/change-password" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                                    <span className="p-1.5 rounded-lg bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg>
                                    </span>
                                    <span className="font-medium">Change Password</span>
                                </Link>
                            </div>

                            <div className="py-2 border-t border-glass-border/50">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all group"
                                >
                                    <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    </span>
                                    <span className="font-bold uppercase tracking-wider text-[11px]">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
