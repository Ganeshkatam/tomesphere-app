'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldAlert } from 'lucide-react';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Check profile for role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role === 'admin') {
                setAuthorized(true);
            } else {
                // Not authorized
                setAuthorized(false);
            }
        } catch (error) {
            console.error('Auth check failed', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 animate-pulse">Verifying privileges...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert size={40} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                        <p className="text-slate-400 mb-8">
                            You do not have permission to view this area. This incident has been logged.
                        </p>
                        <button
                            onClick={() => router.push('/home')}
                            className="btn btn-secondary w-full"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
