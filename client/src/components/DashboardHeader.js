"use client";
import React from 'react';
const DashboardHeader = ({ user }) => {
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

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full border-2 border-glass-border overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold shadow-lg group-hover:border-primary/50 transition-all">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white tracking-tight group-hover:text-primary transition-colors">
                            {user?.name?.split(' ')[0] || 'User'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-white transition-all"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
