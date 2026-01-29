"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ValidationError from '@/components/ValidationError';
import { validateEmail } from '@/utils/validators';

export default function LoginPage() {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
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
                        <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
                        <p className="text-gray-400">Login to manage VerifyCert</p>
                    </div>

                    {isRegistered && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded mb-6 text-sm">
                            Registration successful! Please login with your credentials.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 text-sm">
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
                            className="w-full"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                            ← Back to Homepage
                        </Link>
                    </div>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
