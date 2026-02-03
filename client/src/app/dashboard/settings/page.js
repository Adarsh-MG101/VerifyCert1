"use client";
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import DisplayField from '@/components/DisplayField';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/services/authService';

export default function AccountSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const data = await updatePassword(currentPassword, newPassword);

            if (data.message) {
                setSuccess('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => router.push('/dashboard'), 2000);
            } else {
                setError(data.error || 'Failed to update password');
            }
        } catch (err) {
            console.error('Error updating password:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-7xl mx-auto py-10 animate-fade-in">
            {/* <h1 className="text-3xl font-bold mb-8">Account Settings</h1> */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card title="Profile Information" subtitle="Your registered account details">
                    <div className="p-2 space-y-4">
                        <DisplayField
                            label="Email Address"
                            value={user?.email || 'Loading...'}
                            variant="muted"
                            extra={<span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase font-bold tracking-tighter border border-primary/20">Verified</span>}
                            subtext="Email address cannot be changed at this time."
                        />
                    </div>
                </Card>

                <Card title="Security" subtitle="Update your password to keep your account safe">
                    <form onSubmit={handleUpdatePassword} className="p-2 space-y-6">
                        <Input
                            label="Current Password"
                            type="password"
                            placeholder="••••••••"
                            value="********"
                            disabled
                            className="opacity-50 grayscale cursor-not-allowed"
                        />

                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <Input
                                label="Confirm New Password"
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg">
                                {success}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                className="border border-border"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
