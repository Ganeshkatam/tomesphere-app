'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function PhoneLoginPage() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

            const { error } = await supabase.auth.signInWithOtp({
                phone: formattedPhone,
            });

            if (error) throw error;

            toast.success('OTP sent to your phone!');
            setStep('otp');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to send OTP. Check Supabase phone auth setup.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

            const { error } = await supabase.auth.verifyOtp({
                phone: formattedPhone,
                token: otp,
                type: 'sms'
            });

            if (error) throw error;

            toast.success('Login successful!');

            // Redirect with delay for session persistence
            setTimeout(() => {
                window.location.href = '/home';
            }, 2000);
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Invalid OTP');
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
                    <h1 className="text-3xl font-display font-bold mb-2">Phone Login</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {step === 'phone' ? 'Enter your phone number' : 'Enter the OTP sent to your phone'}
                    </p>
                </div>

                {/* Phone Step */}
                {step === 'phone' && (
                    <form onSubmit={handleSendOTP} className="card animate-slideUp">
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Phone Number (with country code)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !loading) {
                                        e.preventDefault();
                                        handleSendOTP(e as any);
                                    }
                                }}
                                placeholder="+1234567890"
                                className="w-full"
                                required
                                autoFocus
                            />
                            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                                Example: +11234567890 (USA), +919876543210 (India)
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mb-4"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    <span>Sending OTP...</span>
                                </>
                            ) : (
                                <>
                                    <span>📱</span>
                                    <span>Send OTP</span>
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <a href="/login" className="text-sm hover:underline" style={{ color: 'var(--text-tertiary)' }}>
                                ← Back to email login
                            </a>
                        </div>
                    </form>
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="card animate-slideUp">
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Enter 6-Digit OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !loading && otp.length === 6) {
                                        e.preventDefault();
                                        handleVerifyOTP(e as any);
                                    }
                                }}
                                placeholder="123456"
                                className="w-full text-center text-2xl tracking-widest font-mono"
                                required
                                maxLength={6}
                                autoFocus
                            />
                            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                                Sent to {phone}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mb-4"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                'Verify & Login'
                            )}
                        </button>

                        <div className="flex justify-between text-sm">
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="hover:underline"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                ← Change number
                            </button>
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={loading}
                                className="hover:underline"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Resend OTP
                            </button>
                        </div>
                    </form>
                )}

                {/* Info Box */}
                <div className="glass rounded-xl p-4 mt-6">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Note:</strong> Phone authentication must be enabled in Supabase Dashboard.
                        If OTP doesn't arrive, check your SMS provider configuration.
                    </p>
                </div>
            </div>
        </div>
    );
}
