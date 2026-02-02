"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [theme, setTheme] = useState('light');

    // Initialize theme from localStorage
    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const showAlert = useCallback((title, message, type = 'info') => {
        setAlert({ isOpen: true, title, message, type });
    }, []);

    const showConfirm = useCallback((title, message, onConfirm) => {
        setConfirm({ isOpen: true, title, message, onConfirm });
    }, []);

    const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));
    const closeConfirm = () => setConfirm(prev => ({ ...prev, isOpen: false }));

    const handleConfirm = () => {
        if (confirm.onConfirm) confirm.onConfirm();
        closeConfirm();
    };

    return (
        <UIContext.Provider value={{ showAlert, showConfirm, theme, toggleTheme }}>
            {children}

            {/* Alert Modal */}
            <Modal
                isOpen={alert.isOpen}
                onClose={closeAlert}
                title={alert.title}
                subtitle={alert.type === 'error' ? '⚠️ Error' : 'ℹ️ Information'}
            >
                <div className="space-y-6">
                    <p className="text-gray-300 leading-relaxed">{alert.message}</p>
                    <Button onClick={closeAlert} className="w-full">OK</Button>
                </div>
            </Modal>

            {/* Confirm Modal */}
            <Modal
                isOpen={confirm.isOpen}
                onClose={closeConfirm}
                title={confirm.title}
                subtitle="❓ Confirmation Required"
            >
                <div className="space-y-6">
                    <p className="text-gray-300 leading-relaxed">{confirm.message}</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1 border border-white/10" onClick={closeConfirm}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={handleConfirm}>Confirm</Button>
                    </div>
                </div>
            </Modal>
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);
