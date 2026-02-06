"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import TemplatePreview from '@/components/TemplatePreview';
import Input from '@/components/Input';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [preview, setPreview] = useState({ isOpen: false, template: null });
    const [rename, setRename] = useState({ isOpen: false, template: null, onSave: null });
    const [renameValue, setRenameValue] = useState('');
    const [savingRename, setSavingRename] = useState(false);
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

    const showTemplatePreview = useCallback((template) => {
        setPreview({ isOpen: true, template });
    }, []);

    const showTemplateRename = useCallback((template, onSave) => {
        setRename({ isOpen: true, template, onSave });
        setRenameValue(template.name);
    }, []);

    const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));
    const closeConfirm = () => setConfirm(prev => ({ ...prev, isOpen: false }));
    const closePreview = () => setPreview(prev => ({ ...prev, isOpen: false }));
    const closeRename = () => setRename(prev => ({ ...prev, isOpen: false }));

    const handleConfirm = () => {
        if (confirm.onConfirm) confirm.onConfirm();
        closeConfirm();
    };

    const handleRenameSubmit = async (e) => {
        e.preventDefault();
        if (rename.onSave) {
            setSavingRename(true);
            try {
                await rename.onSave(renameValue);
                closeRename();
            } finally {
                setSavingRename(false);
            }
        }
    };

    return (
        <UIContext.Provider value={{
            showAlert,
            showConfirm,
            showTemplatePreview,
            showTemplateRename,
            theme,
            toggleTheme
        }}>
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
            >
                <div className="space-y-6">
                    <p className="text-gray-300 leading-relaxed">{confirm.message}</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1 border border-white/10" onClick={closeConfirm}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={handleConfirm}>Confirm</Button>
                    </div>
                </div>
            </Modal>

            {/* Global Template Preview Modal */}
            <Modal
                isOpen={preview.isOpen}
                onClose={closePreview}
                title={preview.template?.name?.replace(/\.[^/.]+$/, "")}
                subtitle="Template Preview"
                className="max-w-2xl"
            >
                {preview.template && (
                    <TemplatePreview
                        template={preview.template}
                        showLabel={false}
                        maxWidth="100%"
                    />
                )}
            </Modal>

            {/* Global Template Rename Modal */}
            <Modal
                isOpen={rename.isOpen}
                onClose={closeRename}
                title="Rename Template"
            >
                {rename.template && (
                    <form onSubmit={handleRenameSubmit} className="space-y-6">
                        <Input
                            label="New Name"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter new template name"
                            required
                        />
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={closeRename}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={savingRename}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);
