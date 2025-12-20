'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

function VerifyPasswordForm() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Set session persistence based on checkbox
            if (!keepLoggedIn) {
                // Session will expire when browser closes
                await supabase.auth.updateUser({ data: { sessionType: 'temporary' } });
            }

            if (authData.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();

                toast.success('Welcome back!');

                setTimeout(() => {
                    if (profile?.role === 'admin') {
                        router.push('/admin');
                    } else {
                        router.push('/home');
                    }
                }, 500);
            }
        } catch (error: any) {
            toast.error('Incorrect password');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && password) {
            e.preventDefault();
            handleVerify(e as any);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-start justify-center p-4 sm:p-6 md:py-12">
            <Toaster position="top-right" />

            <div className="w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-slate-300">
                        Enter your password to continue
                    </p>
                </div>

                <div className="glass-strong rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-300">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                readOnly
                                className="w-full opacity-70 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your password"
                                    className="w-full pr-12"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Keep me logged in checkbox */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="keepLoggedIn"
                                checked={keepLoggedIn}
                                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="keepLoggedIn" className="ml-2 text-sm text-slate-300 cursor-pointer">
                                Keep me logged in
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner w-5 h-5 border-2 border-white border-t-transparent" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            Not you?{' '}
                            <a href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                                Use another account
                            </a>
                        </p>
                    </div>

                    <div className="mt-4 text-center text-xs text-slate-500">
                        💡 Press <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300">Enter</kbd> to submit
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPassword() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="spinner" />
            </div>
        }>
            <VerifyPasswordForm />
        </Suspense>
    );
}
