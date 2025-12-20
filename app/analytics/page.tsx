'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import {
    TrendingUp,
    FileText,
    Target,
    Award,
    Calendar,
    BarChart3
} from 'lucide-react';

interface Stats {
    notesCount: number;
    testsCompleted: number;
    averageScore: number;
    studyStreak: number;
    flashcardsCount: number;
    lastStudyDate: string;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({
        notesCount: 0,
        testsCompleted: 0,
        averageScore: 0,
        studyStreak: 0,
        flashcardsCount: 0,
        lastStudyDate: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch notes count
            const { count: notesCount } = await supabase
                .from('notes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Fetch flashcards count
            const { count: flashcardsCount } = await supabase
                .from('flashcards')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Fetch test attempts
            const { data: attempts } = await supabase
                .from('user_test_attempts')
                .select('score, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            const testsCompleted = attempts?.length || 0;
            const averageScore = attempts?.length
                ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
                : 0;

            // Calculate study streak (simplified)
            const lastStudyDate = attempts?.[0]?.created_at || '';

            setStats({
                notesCount: notesCount || 0,
                testsCompleted,
                averageScore,
                studyStreak: 0, // Would need more complex logic
                flashcardsCount: flashcardsCount || 0,
                lastStudyDate
            });
        } catch (error: any) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <BarChart3 size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-1">Study Analytics</h1>
                            <p className="text-slate-400">Track your progress and achievements</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Notes */}
                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-purple-600/20 rounded-xl">
                                <FileText size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Notes Created</p>
                                <p className="text-3xl font-bold text-white">{stats.notesCount}</p>
                            </div>
                        </div>
                        <div className="h-1 bg-purple-600/20 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: '70%' }} />
                        </div>
                    </div>

                    {/* Tests */}
                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-pink-600/20 rounded-xl">
                                <Target size={24} className="text-pink-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Tests Completed</p>
                                <p className="text-3xl font-bold text-white">{stats.testsCompleted}</p>
                            </div>
                        </div>
                        <div className="h-1 bg-pink-600/20 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-600 rounded-full" style={{ width: '50%' }} />
                        </div>
                    </div>

                    {/* Average Score */}
                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-blue-600/20 rounded-xl">
                                <TrendingUp size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Average Score</p>
                                <p className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                                    {stats.averageScore.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="h-1 bg-blue-600/20 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.averageScore}%` }} />
                        </div>
                    </div>

                    {/* Flashcards */}
                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-green-600/20 rounded-xl">
                                <Award size={24} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Flashcards</p>
                                <p className="text-3xl font-bold text-white">{stats.flashcardsCount}</p>
                            </div>
                        </div>
                        <div className="h-1 bg-green-600/20 rounded-full overflow-hidden">
                            <div className="h-full bg-green-600 rounded-full" style={{ width: '60%' }} />
                        </div>
                    </div>
                </div>

                {/* Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="glass-strong rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar size={20} />
                            Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {stats.lastStudyDate ? (
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Last Study Session</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(stats.lastStudyDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="glass-strong rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Award size={20} />
                            Achievements
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {stats.notesCount >= 5 && (
                                <div className="p-4 bg-purple-600/20 rounded-xl text-center">
                                    <div className="text-3xl mb-2">📝</div>
                                    <p className="text-xs text-purple-300 font-medium">Note Taker</p>
                                </div>
                            )}
                            {stats.testsCompleted >= 3 && (
                                <div className="p-4 bg-pink-600/20 rounded-xl text-center">
                                    <div className="text-3xl mb-2">🎯</div>
                                    <p className="text-xs text-pink-300 font-medium">Test Master</p>
                                </div>
                            )}
                            {stats.averageScore >= 80 && (
                                <div className="p-4 bg-blue-600/20 rounded-xl text-center">
                                    <div className="text-3xl mb-2">⭐</div>
                                    <p className="text-xs text-blue-300 font-medium">High Achiever</p>
                                </div>
                            )}
                            {stats.flashcardsCount >= 10 && (
                                <div className="p-4 bg-green-600/20 rounded-xl text-center">
                                    <div className="text-3xl mb-2">🃏</div>
                                    <p className="text-xs text-green-300 font-medium">Card Collector</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 glass-strong rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => router.push('/notes/create')}
                            className="p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-xl transition-all text-center"
                        >
                            <FileText size={24} className="text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-white font-medium">Create Note</p>
                        </button>
                        <button
                            onClick={() => router.push('/exam-prep/tests')}
                            className="p-4 bg-pink-600/20 hover:bg-pink-600/30 rounded-xl transition-all text-center"
                        >
                            <Target size={24} className="text-pink-400 mx-auto mb-2" />
                            <p className="text-sm text-white font-medium">Take Test</p>
                        </button>
                        <button
                            onClick={() => router.push('/exam-prep/flashcards')}
                            className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl transition-all text-center"
                        >
                            <Award size={24} className="text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-white font-medium">Study Flashcards</p>
                        </button>
                        <button
                            onClick={() => router.push('/study-groups')}
                            className="p-4 bg-green-600/20 hover:bg-green-600/30 rounded-xl transition-all text-center"
                        >
                            <Calendar size={24} className="text-green-400 mx-auto mb-2" />
                            <p className="text-sm text-white font-medium">Join Group</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
