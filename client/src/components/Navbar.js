import React from 'react';
import Link from 'next/link';
import Button from './Button';

const Navbar = () => {
    return (
        <nav className="w-full border-b border-glass-border bg-background/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/">
                    <div className="flex items-center space-x-2 group">
                        <span className="text-2xl font-bold gradient-text group-hover:opacity-80 transition-opacity">VerifyCert</span>
                    </div>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Home</Link>
                    <Link href="/verify" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Verify</Link>
                    <Link href="/about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">About</Link>
                </div>

                <div className="flex items-center space-x-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-sm px-4 py-2 border border-transparent hover:border-glass-border">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button className="text-sm px-5 py-2">
                            Register
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
