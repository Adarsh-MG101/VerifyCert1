import React from 'react';

const Footer = () => {
    return (
        <footer className="p-8 mt-auto border-t border-border">
            <div className="container mx-auto text-center text-muted text-sm">
                <p>&copy; {new Date().getFullYear()} VerifyCert. All rights reserved.</p>
                <div className="mt-2 space-x-4">
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-primary transition-colors">Support</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
