'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Loader2, RefreshCw } from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';

export default function VerificationStatus() {
    const [status, setStatus] = useState({
        emailVerified: false,
        phoneVerified: false,
        loading: true
    });

    useEffect(() => {
        // Initial check
        checkVerification();

        // Real-time subscription for user updates
        const channel = supabase.channel('user_verification')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'auth',
                table: 'users',
                filter: `id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
            }, (payload) => {
                console.log('User update received:', payload);
                checkVerification();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const checkVerification = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setStatus({
                emailVerified: !!user.email_confirmed_at,
                phoneVerified: !!user.phone_confirmed_at,
                loading: false
            });
        }
    };

    const resendEmail = async () => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: (await supabase.auth.getUser()).data.user?.email || ''
        });
        if (error) showError('Failed to send email');
        else showSuccess('Verification email sent!');
    };

    if (status.loading) return <div className="h-20 animate-pulse bg-white/5 rounded-xl" />;

    return (
        <div className="glass rounded-xl p-6 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <RefreshCw size={18} className="text-primary" />
                Verification Status
            </h3>

            {/* Email Status */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${status.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {status.emailVerified ? <Check size={16} /> : <X size={16} />}
                    </div>
                    <div>
                        <p className="font-medium">Email Verification</p>
                        <p className="text-xs text-slate-400">
                            {status.emailVerified ? 'Verified' : 'Pending verification'}
                        </p>
                    </div>
                </div>
                {!status.emailVerified && (
                    <button onClick={resendEmail} className="text-xs btn btn-secondary py-1 px-3">
                        Resend
                    </button>
                )}
            </div>

            {/* Phone Status */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${status.phoneVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {status.phoneVerified ? <Check size={16} /> : <X size={16} />}
                    </div>
                    <div>
                        <p className="font-medium">Phone Verification</p>
                        <p className="text-xs text-slate-400">
                            {status.phoneVerified ? 'Verified' : 'Pending verification'}
                        </p>
                    </div>
                </div>
                {!status.phoneVerified && (
                    <button onClick={() => window.location.href = '/profile/verify-phone'} className="text-xs btn btn-secondary py-1 px-3">
                        Verify
                    </button>
                )}
            </div>
        </div>
    );
}
