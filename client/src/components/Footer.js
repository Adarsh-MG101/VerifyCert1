import React from 'react';

const Footer = () => {
    return (
        <footer className="p-8 mt-auto border-t border-glass-border">
            <div className="container mx-auto text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} VerifyCert. All rights reserved.</p>
                <div className="mt-2 space-x-4">
                    <a href="#" className="hover:text-gray-300">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-300">Terms of Service</a>
                    <a href="#" className="hover:text-gray-300">Support</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
