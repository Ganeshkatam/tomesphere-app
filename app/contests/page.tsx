'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ContestCard, { Contest } from '@/components/ContestCard';
import { supabase } from '@/lib/supabase';
import { Trophy, Flame, Calendar, History } from 'lucide-react';
import { showError } from '@/lib/toast';

export default function ContestsPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'past'>('active');
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContests();
    }, [activeTab]);

    const fetchContests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('*')
                .eq('status', activeTab)
                .order('end_date', { ascending: true });

            if (error) throw error;
            setContests(data || []);
        } catch (error) {
            console.error('Error fetching contests:', error);
            showError('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page">
            {/* <Toaster position="top-right" /> */}
            <Navbar role="user" currentPage="/contests" />

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12 animate-fadeIn">
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6">
                        Live Contests
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Compete with fellow readers, test your knowledge, and win exclusive rewards in our community events.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="glass-strong p-1 rounded-xl flex gap-1">
                        {[
                            { id: 'active', label: 'Live Now', icon: Flame },
                            { id: 'upcoming', label: 'Upcoming', icon: Calendar },
                            { id: 'past', label: 'Past Events', icon: History },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slideIn">
                        {contests.length > 0 ? (
                            contests.map(contest => (
                                <ContestCard key={contest.id} contest={contest} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-xl">No {activeTab} contests found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
