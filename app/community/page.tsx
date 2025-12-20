'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import CommunityClient from './CommunityClient';

export default function CommunityPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
            setLoading(false);
        } catch (error) {
            console.error('Error loading user:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page">
            <Toaster position="top-right" />
            <Navbar role={user?.role || 'user'} currentPage="/community" />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <CommunityClient />
            </div>
        </div>
    );
}
