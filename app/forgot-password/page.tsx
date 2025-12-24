'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const router = useRouter();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            showError('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            showSuccess('Password reset link sent to your email!');
            setSent(true);
        } catch (error: any) {
            console.error('Error:', error);
            showError(error.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-start justify-center p-4 sm:p-6 md:py-12">
            {/* <Toaster position="top-right" /> */}

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 animate-fadeIn">
                    <a href="/" className="inline-flex items-center gap-3 mb-6">
                        <span className="text-5xl">📚</span>
                        <span className="text-3xl font-display font-bold gradient-text">TomeSphere</span>
                    </a>
                    <h1 className="text-3xl font-display font-bold mb-2">Forgot Password?</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No worries, we'll send you reset instructions
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleResetPassword} className="card animate-slideUp">
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mb-4"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        <div className="text-center">
                            <a href="/login" className="text-sm hover:underline" style={{ color: 'var(--text-tertiary)' }}>
                                ← Back to login
                            </a>
                        </div>
                    </form>
                ) : (
                    <div className="card animate-scaleIn text-center">
                        <div className="text-6xl mb-4">✉️</div>
                        <h2 className="text-2xl font-display font-bold mb-3">Check Your Email</h2>
                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                            We've sent a password reset link to <br />
                            <strong>{email}</strong>
                        </p>
                        <div className="glass rounded-xl p-4 mb-6">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                📝 Click the link in the email to reset your password.
                                The link expires in 1 hour.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSent(false)}
                                className="btn btn-ghost flex-1"
                            >
                                Try Another Email
                            </button>
                            <a href="/login" className="btn-primary flex-1">
                                Back to Login
                            </a>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="glass rounded-xl p-4 mt-6">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Didn't receive email?</strong> Check your spam folder or try resending.
                        Still having trouble? Contact support.
                    </p>
                </div>
            </div>
        </div>
    );
}
