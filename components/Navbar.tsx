'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, Book, Users, User, LogOut, Menu, X, Download, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import NotificationCenter from '@/components/NotificationCenter';
import ThemeToggle from './ThemeToggle';
import { usePWA } from '@/lib/pwa-context';

interface NavbarProps {
    role?: string;
    currentPage?: string;
}

export default function Navbar({ role, currentPage }: NavbarProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { installPrompt, isInstalled, promptInstall } = usePWA();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error && error.message !== 'Auth session missing!') {
                console.warn('Auth check warning:', error.message);
            }
            setUser(user);
        } catch (error) {
            console.error('Auth check error:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Logged out successfully');
            setMobileMenuOpen(false);
            router.push('/');
        } catch (error: any) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    const isActive = (path: string) => currentPage === path;

    const navLinks = role === 'admin' ? [
        { href: '/admin', label: 'Admin Panel', icon: '🛠️' },
        { href: '/home', label: 'Discover', icon: '📚' },
    ] : [
        { href: '/home', label: 'Discover', icon: '📚' },
        { href: '/explore', label: 'Explore', icon: '🔍' },
        { href: '/library', label: 'Library', icon: '📖' },
        { href: '/community', label: 'Community', icon: '👥' },
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    ];

    return (
        <>
            <nav className="glass-nav sticky top-0 z-50">
                <div className="w-full px-4 sm:px-8 lg:px-16">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <a href={user ? "/home" : "/"} className="flex items-center gap-2 group">
                            <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">📚</span>
                            <span className="text-lg sm:text-xl font-bold gradient-text">TomeSphere</span>
                        </a>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-2">
                            {/* Download App */}
                            {/* Install App Button (Desktop) */}
                            {installPrompt && !isInstalled && (
                                <button
                                    onClick={() => promptInstall()}
                                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:scale-105"
                                    title="Install App"
                                >
                                    <Download size={16} />
                                    <span className="hidden xl:inline">Get App</span>
                                </button>
                            )}

                            {/* Notifications */}
                            {user && <NotificationCenter user={user} />}

                            {user ? (
                                <>
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            className={`px-4 py-2 rounded-lg transition-all ${isActive(link.href)
                                                ? 'bg-primary text-white'
                                                : 'text-slate-300 hover:bg-white/10'
                                                }`}
                                        >
                                            {link.icon} {link.label}
                                        </a>
                                    ))}

                                    <a
                                        href="/profile"
                                        className={`px-4 py-2 rounded-lg transition-all ${isActive('/profile')
                                            ? 'bg-primary text-white'
                                            : 'text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        👤 Profile
                                    </a>

                                    <ThemeToggle />

                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 rounded-lg text-red-300 hover:bg-red-600/20 transition-all"
                                    >
                                        🚪 Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a
                                        href="/explore"
                                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-all"
                                    >
                                        🔍 Explore Books
                                    </a>
                                    <a
                                        href="/login"
                                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-all"
                                    >
                                        Sign In
                                    </a>
                                    <a
                                        href="/signup"
                                        className="btn-primary"
                                    >
                                        Get Started
                                    </a>
                                </>
                            )}
                        </div>

                        {/* Mobile: Quick Actions + Hamburger */}
                        <div className="flex lg:hidden items-center gap-2">
                            {/* Quick Access Icons for Mobile */}
                            {user && <NotificationCenter user={user} />}

                            <Link
                                href="/explore"
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <Compass size={20} />
                            </Link>

                            <Link
                                href="/profile"
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <User size={20} />
                            </Link>

                            <ThemeToggle />

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Side Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <span className="text-lg font-bold text-white">Menu</span>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {user ? (
                            <>
                                {navLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-6 py-4 transition-all ${isActive(link.href)
                                            ? 'bg-primary/20 text-primary border-r-2 border-primary'
                                            : 'text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-xl">{link.icon}</span>
                                        <span className="font-medium">{link.label}</span>
                                    </a>
                                ))}

                                <div className="my-2 border-t border-white/10" />

                                <a
                                    href="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-6 py-4 transition-all ${isActive('/profile')
                                        ? 'bg-primary/20 text-primary border-r-2 border-primary'
                                        : 'text-slate-300 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-xl">👤</span>
                                    <span className="font-medium">Profile</span>
                                </a>

                                {installPrompt && !isInstalled && (
                                    <button
                                        onClick={() => {
                                            promptInstall();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-white/5 transition-all text-left"
                                    >
                                        <Download size={20} />
                                        <span className="font-medium">Install App</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <a
                                    href="/explore"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-white/5 transition-all"
                                >
                                    <span className="text-xl">🔍</span>
                                    <span className="font-medium">Explore Books</span>
                                </a>
                                <a
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-white/5 transition-all"
                                >
                                    <span className="text-xl">🔐</span>
                                    <span className="font-medium">Sign In</span>
                                </a>
                            </>
                        )}
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-4 border-t border-white/10">
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            >
                                <LogOut size={18} />
                                <span className="font-medium">Logout</span>
                            </button>
                        ) : (
                            <a
                                href="/signup"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-center w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-all"
                            >
                                Get Started
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
