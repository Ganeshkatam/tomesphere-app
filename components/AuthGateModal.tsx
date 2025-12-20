'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGateModalProps {
    onClose: () => void;
}

export default function AuthGateModal({ onClose }: AuthGateModalProps) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in animation
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const handleAction = (action: 'signin' | 'signup' | 'skip') => {
        // Set localStorage flag
        localStorage.setItem('hasSeenAuthGate', 'true');

        // Fade out
        setIsVisible(false);

        setTimeout(() => {
            onClose();

            if (action === 'signin') {
                router.push('/login');
            } else if (action === 'signup') {
                router.push('/signup');
            }
            // If skip, just close
        }, 300);
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
            {/* Modal Card */}
            <div
                className={`relative max-w-md w-full glass-strong rounded-3xl p-8 border border-white/10 shadow-2xl transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent rounded-3xl" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Icon */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-4">
                            <span className="text-4xl">📚</span>
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-2">
                            Welcome to TomeSphere
                        </h2>
                        <p className="text-slate-300 text-sm">
                            Discover your next favorite book in our curated collection
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="mb-8 space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <p className="text-sm text-slate-300">Save books to your personal library</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <p className="text-sm text-slate-300">Get AI-powered book recommendations</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <p className="text-sm text-slate-300">Join our vibrant reading community</p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        {/* Sign Up */}
                        <button
                            onClick={() => handleAction('signup')}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-[1.02]"
                        >
                            Create Account
                        </button>

                        {/* Sign In */}
                        <button
                            onClick={() => handleAction('signin')}
                            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl font-medium transition-all duration-300"
                        >
                            Sign In
                        </button>

                        {/* Skip */}
                        <button
                            onClick={() => handleAction('skip')}
                            className="w-full px-6 py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            Continue as Guest →
                        </button>
                    </div>

                    {/* Small Print */}
                    <p className="text-center text-xs text-slate-500 mt-6">
                        By continuing, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
}
