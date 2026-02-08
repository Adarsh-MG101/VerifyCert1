import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-white text-gray-600 py-16 border-t border-gray-200">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="text-3xl font-bold text-primary mb-6 font-header">
                            VerifyCert
                        </div>
                        <p className="text-sm leading-relaxed mb-6">
                            The industrial standard for secure document issuance and verification. Trusted by organizations worldwide for immutable proof of authenticity.
                        </p>
                        <div className="flex space-x-4">
                            {/* Social Placeholders */}
                            <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-[2px] hover:bg-primary hover:text-white transition-colors cursor-pointer text-gray-700">
                                <span className="text-xs font-bold">in</span>
                            </div>
                            <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-[2px] hover:bg-primary hover:text-white transition-colors cursor-pointer text-gray-700">
                                <span className="text-xs font-bold">tw</span>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-gray-900 font-bold uppercase tracking-wider mb-6 text-sm font-header">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="#verify" className="hover:text-primary transition-colors">Verify Document</Link></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">Login / Register</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-gray-900 font-bold uppercase tracking-wider mb-6 text-sm font-header">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                        </ul>
                    </div>

                    {/* Contact - Optional */}
                    <div>
                        <h4 className="text-gray-900 font-bold uppercase tracking-wider mb-6 text-sm font-header">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">📍</span>
                                <span>123 Security Blvd,<br />Tech City, TC 90210</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-primary">✉️</span>
                                <span>support@verifycert.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
                    <p>&copy; {new Date().getFullYear()} VerifyCert. All rights reserved.</p>
                    <p className="mt-2 md:mt-0 opacity-50">Designed with precision.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
