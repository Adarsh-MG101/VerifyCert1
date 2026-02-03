"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Button,
    Card,
    Input,
    Navbar,
    Footer,
    ValidationError
} from '@/components';
import { validateEmail } from '@/utils/validators';
import { login } from '@/services/authService';

import { Suspense } from 'react';

function LoginContent() {
    const searchParams = useSearchParams();
    const isRegistered = searchParams.get('registered');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Just clear errors on mount
        setError('');
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const emailError = validateEmail(email);
        if (emailError) {
            setFieldErrors({ email: emailError });
            return;
        }

        setLoading(true);

        try {
            const response = await login(email, password);
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.replace('/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 animate-fade-in">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-primary mb-2 font-header">Welcome Back</h1>
                        <p className="text-gray-500 font-subtitle">Login to manage VerifyCert</p>
                    </div>

                    {isRegistered && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-6 text-sm">
                            Registration successful! Please login with your credentials.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Honeypot/Bait inputs to trick browser autofill */}
                        <div style={{ display: 'none' }}>
                            <input type="text" name="fake-email" />
                            <input type="password" name="fake-password" />
                        </div>

                        <div>
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                                autoComplete="new-off"
                                required
                            />
                            <ValidationError message={fieldErrors.email} />
                        </div>

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full text-white"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">
                            ← Back to Homepage
                        </Link>
                    </div>
                </Card>
            </main>
            <Footer />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

