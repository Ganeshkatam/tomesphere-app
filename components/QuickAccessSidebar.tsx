'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Home,
    Search,
    BookOpen,
    Users,
    BarChart3,
    User,
    LogOut,
    Menu,
    X,
    Download
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { showSuccess } from '@/lib/toast';
import { usePWA } from '@/lib/pwa-context';

export default function QuickAccessSidebar() {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { installPrompt, isInstalled, promptInstall } = usePWA();

    // Ensure component is mounted before rendering (fixes ThemeProvider issue)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check authentication
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
    };

    // Show/hide button based on scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 200);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        showSuccess('Logged out successfully');
        setIsOpen(false);
        router.push('/');
    };

    const navigateTo = (path: string) => {
        router.push(path);
        setIsOpen(false);
    };

    const quickLinks = isLoggedIn ? [
        { icon: Home, label: 'Discover', path: '/home' },
        { icon: Search, label: 'Explore', path: '/explore' },
        { icon: BookOpen, label: 'Library', path: '/library' },
        { icon: Users, label: 'Community', path: '/community' },
        { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
        { icon: User, label: 'Profile', path: '/profile' },
    ] : [
        { icon: Search, label: 'Explore Books', path: '/explore' },
        { icon: User, label: 'Sign In', path: '/login' },
    ];

    const isActive = (path: string) => pathname === path;

    // Don't render until mounted (prevents ThemeProvider error)
    if (!mounted) {
        return null;
    }

    return (
        <>
            {/* Floating Trigger Button - Right Side */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed right-6 top-24 z-40 w-14 h-14 rounded-full glass-strong border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-primary/50 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
                aria-label="Open quick access menu"
            >
                <Menu size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                />
            )}

            {/* Slide-in Panel from Right */}
            <div
                className={`fixed right-0 top-0 h-full w-80 z-[100] glass-ultra border-l border-white/10 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📚</span>
                        <span className="text-xl font-bold gradient-text">TomeSphere</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Quick Links */}
                <div className="p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
                        Quick Access
                    </h3>
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.path);
                        return (
                            <button
                                key={link.path}
                                onClick={() => navigateTo(link.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                                    ? 'bg-primary text-white shadow-glow-primary'
                                    : 'hover:bg-white/10 text-slate-300 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="font-medium">{link.label}</span>
                            </button>
                        );
                    })}

                    {/* Install App - Special Item */}
                    {installPrompt && !isInstalled && (
                        <button
                            onClick={() => {
                                promptInstall();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/10 text-slate-300 hover:text-white"
                        >
                            <Download size={18} />
                            <span className="font-medium">Install App</span>
                        </button>
                    )}
                </div>

                {/* Theme Toggle */}
                <div className="px-4 mt-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-sm text-slate-400">Theme</span>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Logout Button (if logged in) */}
                {isLoggedIn && (
                    <div className="absolute bottom-6 left-0 right-0 px-4">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 transition-all"
                        >
                            <LogOut size={18} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Fade In Animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
}
