'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react';

export default function PricingPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();
            setSubscription(data);
        }
    };

    const handleSubscribe = async (priceId?: string) => {
        if (!user) {
            router.push('/login?redirect=/pricing');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    priceId,
                }),
            });

            const { url, error } = await response.json();
            if (error) throw new Error(error);
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/create-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });

            const { url, error } = await response.json();
            if (error) throw new Error(error);
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Portal error:', error);
            alert('Failed to open billing portal.');
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: 'forever',
            description: 'Perfect for casual readers',
            features: [
                'Access to free books',
                'Basic reading progress tracking',
                'Community access',
                'Standard recommendations',
            ],
            cta: subscription ? 'Current Plan' : 'Get Started',
            popular: false,
            disabled: !!subscription,
        },
        {
            name: 'Premium',
            price: '$9.99',
            period: '/month',
            description: 'For the serious bibliophile',
            features: [
                'Everything in Free',
                'Unlimited AI-powered recommendations',
                'Advanced reading analytics',
                'Priority customer support',
                'Early access to new features',
                'Exclusive book collections',
                'Ad-free experience',
            ],
            cta: subscription ? 'Manage Subscription' : 'Subscribe Now',
            popular: true,
            disabled: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-page py-20">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-300">Choose Your Plan</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                        <span className="text-white">Unlock Your </span>
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Reading Potential
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Get more from TomeSphere with Premium features designed for passionate readers.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-8 transition-all duration-300 ${plan.popular
                                    ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-105'
                                    : 'bg-slate-900/50 border border-white/10 hover:border-white/20'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium">
                                        <Crown className="w-4 h-4" />
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-slate-400">{plan.period}</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className={`w-5 h-5 mt-0.5 ${plan.popular ? 'text-indigo-400' : 'text-green-400'}`} />
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    if (plan.name === 'Free' && !subscription) {
                                        router.push('/signup');
                                    } else if (plan.name === 'Premium') {
                                        if (subscription) {
                                            handleManageSubscription();
                                        } else {
                                            handleSubscribe();
                                        }
                                    }
                                }}
                                disabled={plan.disabled || loading}
                                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${plan.popular
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    } ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {plan.popular && <Zap className="w-5 h-5" />}
                                        {plan.cta}
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ or Trust Badges */}
                <div className="text-center mt-16 text-slate-500 text-sm">
                    <p>🔒 Secure payment powered by Stripe</p>
                    <p className="mt-2">Cancel anytime. No hidden fees.</p>
                </div>
            </div>
        </div>
    );
}
