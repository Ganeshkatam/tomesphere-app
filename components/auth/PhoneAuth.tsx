'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function PhoneAuth() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });

            if (error) throw error;

            setStep('otp');
            showError('Please enter a valid phone number');
        } catch (error: any) {
            showError(error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: phone,
                token: otp,
                type: 'sms',
            });

            if (error) throw error;

            showSuccess('Phone verified successfully!');
            // Redirect handled by auth state listener or parent component
        } catch (error: any) {
            showError(error.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Phone Sign In</h3>
                <p className="text-slate-400 text-sm mt-1">
                    {step === 'phone' ? 'Enter your phone number to receive a code' : 'Enter the code sent to your phone'}
                </p>
            </div>

            {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+1234567890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all placeholder:text-slate-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                Send Code <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Verification Code</label>
                        <input
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all placeholder:text-slate-600 text-center tracking-widest text-lg"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Sign In'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('phone')}
                        className="w-full text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        Change Phone Number
                    </button>
                </form>
            )}
        </div>
    );
}
