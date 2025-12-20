'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionStatusProps {
    userId: string;
}

export default function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        fetchSubscription();
    }, [userId]);

    const fetchSubscription = async () => {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'trialing'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setSubscription(data);
            }
        } catch (err) {
            console.error('Error fetching subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        try {
            const response = await fetch('/api/create-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            const { url, error } = await response.json();
            if (error) throw new Error(error);
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Portal error:', error);
            alert('Failed to open billing portal.');
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400">Current Plan</p>
                        <p className="text-lg font-semibold text-white">Free</p>
                    </div>
                    <Link
                        href="/pricing"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                    >
                        <Crown className="w-4 h-4" />
                        Upgrade
                    </Link>
                </div>
            </div>
        );
    }

    const periodEnd = new Date(subscription.current_period_end);
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    return (
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-indigo-400" />
                    <span className="text-lg font-semibold text-white">Premium</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {subscription.status}
                </span>
            </div>

            <p className="text-sm text-slate-400 mb-4">
                {subscription.cancel_at_period_end
                    ? `Cancels on ${periodEnd.toLocaleDateString()}`
                    : `Renews on ${periodEnd.toLocaleDateString()}`
                }
            </p>

            <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-all disabled:opacity-50"
            >
                {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <ExternalLink className="w-4 h-4" />
                        Manage Subscription
                    </>
                )}
            </button>
        </div>
    );
}
