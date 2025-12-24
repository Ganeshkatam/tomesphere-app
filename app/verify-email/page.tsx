'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [resending, setResending] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        setEmail(user.email || '');

        // If already verified, redirect to home
        if (user.email_confirmed_at) {
            showSuccess('Email already verified!');
            setTimeout(() => router.push('/home'), 1000);
        }
    };

    const resendVerification = async () => {
        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            showSuccess('Verification email resent! Check your inbox.');
        } catch (error: any) {
            showError('Failed to resend email');
        } finally {
            setResending(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-start justify-center p-4 sm:p-6 md:py-12">
            {/* <Toaster position="top-right" /> */}

            <div className="max-w-md w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                {/* Icon */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <span className="text-5xl">📧</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
                    <p className="text-slate-400">
                        We sent a verification link to
                    </p>
                    <p className="text-white font-medium mt-1">{email}</p>
                </div>

                {/* Instructions */}
                <div className="space-y-4 mb-6">
                    <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <span>📝</span> Next Steps:
                        </h3>
                        <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                            <li>Check your email inbox</li>
                            <li>Click the verification link</li>
                            <li>Return here and you'll be redirected</li>
                        </ol>
                    </div>

                    <div className="backdrop-blur-sm bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                        <p className="text-sm text-amber-200 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Check your spam folder if you don't see the email</span>
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={resendVerification}
                        disabled={resending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </button>

                    <button
                        onClick={checkUser}
                        className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-colors border border-white/10"
                    >
                        I've Verified - Continue
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full text-slate-400 hover:text-white py-2 text-sm transition-colors"
                    >
                        Sign out
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-sm text-slate-400">
                        Need help?{' '}
                        <a href="mailto:support@tomesphere.com" className="text-indigo-400 hover:text-indigo-300">
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
