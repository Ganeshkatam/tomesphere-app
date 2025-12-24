'use client';

import { topReaders } from '@/lib/mockSocialData';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';
import { useState, useEffect } from 'react';

export default function TopReaders() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
    }, []);

    const handleFollow = async (readerName: string) => {
        if (!user) {
            showError('Please sign in to follow readers');
            router.push('/login');
            return;
        }

        showSuccess(`Now following ${readerName}!`);
        // In future: await supabase.from('follows').insert(...)
    };

    const handleStartJourney = () => {
        if (!user) {
            router.push('/signup');
        } else {
            router.push('/home');
        }
    };

    return (
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">🏆 Top Readers This Month</h3>
            </div>

            <div className="space-y-3">
                {topReaders.map((reader, index) => (
                    <div
                        key={reader.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all ${index === 0
                            ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30'
                            : index === 1
                                ? 'bg-gradient-to-r from-slate-400/20 to-slate-600/20 border border-slate-500/30'
                                : index === 2
                                    ? 'bg-gradient-to-r from-amber-700/20 to-amber-900/20 border border-amber-700/30'
                                    : 'bg-white/5 border border-white/10'
                            }`}
                    >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                            {index + 1}
                        </div>

                        {/* Avatar */}
                        <img
                            src={reader.avatar}
                            alt={reader.name}
                            className="w-12 h-12 rounded-full ring-2 ring-white/20"
                        />

                        {/* Info */}
                        <div className="flex-1">
                            <p className="font-semibold text-white">{reader.name}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>📚 {reader.booksRead} books</span>
                                <span>🔥 {reader.streak} day streak</span>
                            </div>
                        </div>

                        {/* Follow Button */}
                        <button
                            onClick={() => handleFollow(reader.name)}
                            className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Follow
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-400 mb-3">Think you can make the top 5?</p>
                <button
                    onClick={handleStartJourney}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
                >
                    Start Your Reading Journey
                </button>
            </div>
        </div>
    );
}
