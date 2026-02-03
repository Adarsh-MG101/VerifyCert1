"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { logout as logoutService } from '@/services/authService';

const DashboardHeader = ({ user }) => {
    const { theme, toggleTheme } = useUI();
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsProfileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await logoutService();
        } catch (err) {
            console.error('Logout error:', err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <header className="w-full border-b border-border bg-card/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-40 transition-colors">
            <div className="flex items-center space-x-5">
            </div>

            <div className="flex items-center space-x-4">
                {/* Search */}
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    )}
                </button>

                {/* Notifications */}
                <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative ml-2" ref={dropdownRef}>
                    <div
                        className="flex items-center gap-2 group cursor-pointer"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-9 h-9 rounded-full border border-border overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold transition-all group-hover:border-primary/30">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
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
                            className={`text-gray-400 transition-all ${isProfileOpen ? 'rotate-180 text-primary' : ''}`}
                        >
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-lg shadow-xl z-50 animate-fade-in py-1 overflow-hidden">
                            <div className="px-5 py-3 border-b border-border bg-muted/20">
                                <p className="text-[10px] text-muted font-normal uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-normal text-foreground truncate">{user?.name || 'Administrator'}</p>
                                <p className="text-[10px] text-muted truncate">{user?.email}</p>
                            </div>

                            <div className="py-1">
                                <Link href="/dashboard/profile" className="flex items-center gap-3 px-5 py-2 text-sm text-foreground/80 hover:bg-muted/30 transition-all group">
                                    <span className="text-muted group-hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                                    <span className="font-normal">Personal Info</span>
                                </Link>

                                <Link href="/dashboard/activity" className="flex items-center gap-3 px-5 py-2 text-sm text-foreground/80 hover:bg-muted/30 transition-all group">
                                    <span className="text-muted group-hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span>
                                    <span className="font-normal">User Activity</span>
                                </Link>
                            </div>

                            <div className="py-1 border-t border-border">
                                <Link href="/dashboard/security" className="flex items-center gap-3 px-5 py-2 text-sm text-foreground/80 hover:bg-muted/30 transition-all group">
                                    <span className="text-muted group-hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                                    <span className="font-normal">Security</span>
                                </Link>

                                <Link href="/dashboard/settings" className="flex items-center gap-3 px-5 py-2 text-sm text-foreground/80 hover:bg-muted/30 transition-all group">
                                    <span className="text-muted group-hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg></span>
                                    <span className="font-normal">Settings</span>
                                </Link>
                            </div>

                            <div className="py-1 border-t border-border">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-all font-normal uppercase tracking-wider text-[10px]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    Sign Out
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
