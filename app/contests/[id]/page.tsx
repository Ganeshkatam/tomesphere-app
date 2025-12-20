'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Trophy, Calendar, Users, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ContestDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [contest, setContest] = useState<any>(null);
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        fetchContestDetails();
    }, [params.id]);

    useEffect(() => {
        if (contest) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(contest.end_date).getTime();
                const distance = end - now;

                if (distance < 0) {
                    setTimeLeft('ENDED');
                    clearInterval(timer);
                } else {
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeLeft(`${days}d ${hours}h ${minutes}m`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [contest]);

    const fetchContestDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setContest(data);

            // Check if user joined
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: participant } = await supabase
                    .from('contest_participants')
                    .select('*')
                    .eq('contest_id', params.id)
                    .eq('user_id', user.id)
                    .single();
                if (participant) setJoined(true);
            }
        } catch (error) {
            console.error('Error fetching contest:', error);
            toast.error('Contest not found');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Please login first');
                return;
            }

            const { error } = await supabase
                .from('contest_participants')
                .insert({
                    contest_id: params.id,
                    user_id: user.id
                });

            if (error) throw error;
            setJoined(true);
            toast.success('Successfully joined the contest!');
        } catch (error) {
            console.error('Error joining contest:', error);
            toast.error('Failed to join contest');
        }
    };

    if (loading || !contest) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page">
            <Toaster position="top-right" />
            <Navbar role="user" currentPage="/contests" />

            {/* Banner Image */}
            <div className="h-[40vh] relative w-full overflow-hidden">
                <img
                    src={contest.image_url}
                    alt={contest.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-8">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Contests
                        </button>
                        <h1 className="text-4xl md:text-6xl font-bold font-display text-white mb-4">
                            {contest.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-slate-300">
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                <Trophy className="text-yellow-400" size={20} />
                                {contest.prize_xp} XP Pool
                            </span>
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                <Users className="text-blue-400" size={20} />
                                {contest.participants_count} Participants
                            </span>
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                <Clock className="text-pink-400" size={20} />
                                Time Left: {timeLeft}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">About this Event</h2>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                {contest.description}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Rules & Guidelines</h2>
                            <div className="glass-strong rounded-2xl p-6 space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                                    <p className="text-slate-300">Read books selected from the "Sci-Fi" category.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                                    <p className="text-slate-300">Log your completion using the "Finish Reading" button.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
                                    <p className="text-slate-300">Minimum 50 pages per book require to qualify.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: Actions */}
                    <div className="space-y-6">
                        <div className="glass-strong rounded-2xl p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-6">Your Status</h3>

                            {!joined ? (
                                <button
                                    onClick={handleJoin}
                                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-pink-600/25 transition-all"
                                >
                                    Join Contest
                                </button>
                            ) : (
                                <div className="text-center p-6 border border-green-500/30 rounded-xl bg-green-500/10">
                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                    <h4 className="text-xl font-bold text-white mb-2">You are Registered!</h4>
                                    <p className="text-slate-400 text-sm mb-6">Good luck, reader!</p>
                                    <button
                                        onClick={() => router.push('/library')}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                    >
                                        Go to Library
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h4 className="font-bold text-slate-300 mb-4">Prizes</h4>
                                <ul className="space-y-3">
                                    <li className="flex justify-between text-sm">
                                        <span className="text-yellow-400">🥇 1st Place</span>
                                        <span className="text-slate-400">5000 XP + Rare Badge</span>
                                    </li>
                                    <li className="flex justify-between text-sm">
                                        <span className="text-slate-300">🥈 2nd Place</span>
                                        <span className="text-slate-400">2500 XP</span>
                                    </li>
                                    <li className="flex justify-between text-sm">
                                        <span className="text-orange-400">🥉 3rd Place</span>
                                        <span className="text-slate-400">1000 XP</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
