'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Password updated successfully!');

            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-start justify-center p-4 sm:p-6 md:py-12">
            <Toaster position="top-right" />

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 animate-fadeIn">
                    <a href="/" className="inline-flex items-center gap-3 mb-6">
                        <span className="text-5xl">📚</span>
                        <span className="text-3xl font-display font-bold gradient-text">TomeSphere</span>
                    </a>
                    <h1 className="text-3xl font-display font-bold mb-2">Reset Password</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter your new password below
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="card animate-slideUp">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <div className="spinner" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </form>

                {/* Info Box */}
                <div className="glass rounded-xl p-4 mt-6">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Security tip:</strong> Use a strong password with at least 8 characters,
                        including numbers and special characters.
                    </p>
                </div>
            </div>
        </div>
    );
}
