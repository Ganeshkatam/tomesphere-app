'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    BookOpen,
    LogOut,
    Menu,
    X,
    Settings
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace('/login');
                return;
            }

            // Check if user has admin role
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || profile?.role !== 'admin') {
                toast.error('Unauthorized access');
                router.replace('/home');
                return;
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Admin check failed:', error);
            router.replace('/home');
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Books', href: '/admin/books', icon: BookOpen },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
            <Toaster position="top-right" />

            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-slate-800 rounded-lg text-white shadow-lg border border-white/10"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-white/5">
                        <span className="text-2xl mr-2">🛡️</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            Admin <span className="font-light text-slate-400">Panel</span>
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-white/5 space-y-2">
                        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
                            <Settings size={20} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            <span className="font-medium">Settings</span>
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all group"
                        >
                            <LogOut size={20} className="text-red-400/70 group-hover:text-red-400 transition-colors" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`lg:ml-64 min-h-screen transition-all duration-300`}>
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
