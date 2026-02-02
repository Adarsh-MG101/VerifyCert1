import React from 'react';
import Link from 'next/link';
import Button from './Button';

const Navbar = () => {
    return (
        <nav className="w-full border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/">
                    <div className="flex items-center space-x-2 group">
                        <span className="text-2xl font-bold text-primary group-hover:opacity-80 transition-opacity font-header">VerifyCert</span>
                    </div>
                </Link>

                <div className="flex items-center space-x-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-sm px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 border border-transparent">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button className="text-sm px-5 py-2 text-white">
                            Register
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
