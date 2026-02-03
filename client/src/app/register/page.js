"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Button,
    Card,
    Input,
    Navbar,
    Footer,
    ValidationError
} from '@/components';
import { validateEmail, validatePassword, validateUsername } from '@/utils/validators';
import { register } from '@/services/authService';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validate Fields
        const nameError = validateUsername(name, 30); // Using 30 for Full Name
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (nameError || emailError || passwordError) {
            setFieldErrors({
                name: nameError,
                email: emailError,
                password: passwordError
            });
            return;
        }

        setLoading(true);

        try {
            await register(name, email, password);
            router.push('/login?registered=true');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Registration failed');
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
                        <h1 className="text-3xl font-bold text-primary mb-2 font-header">Create Account</h1>
                        <p className="text-gray-500 font-subtitle">Join VerifyCert to start issuing documents</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <Input
                                label="Full Name"
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
                                required
                            />
                            <ValidationError message={fieldErrors.name} />
                        </div>

                        <div>
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                                autoComplete="off"
                                required
                            />
                            <ValidationError message={fieldErrors.email} />
                        </div>

                        <div>
                            <Input
                                label="Password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null })); }}
                                autoComplete="new-password"
                                required
                            />
                            <ValidationError message={fieldErrors.password} />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full text-white"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                                Login here
                            </Link>
                        </p>
                    </div>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
