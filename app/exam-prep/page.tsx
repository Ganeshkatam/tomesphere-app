'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Brain, Trophy } from 'lucide-react';

interface ExamStats {
    totalTests: number;
    averageScore: number;
    totalFlashcards: number;
}

export default function ExamPrepPage() {
    const router = useRouter();
    const [stats, setStats] = useState<ExamStats>({ totalTests: 0, averageScore: 0, totalFlashcards: 0 });
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

            // Fetch user stats
            const [attemptsResult, flashcardsResult] = await Promise.all([
                supabase.from('user_test_attempts').select('score').eq('user_id', user.id),
                supabase.from('flashcards').select('id').eq('user_id', user.id)
            ]);

            const attempts = attemptsResult.data || [];
            const avgScore = attempts.length > 0
                ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
                : 0;

            setStats({
                totalTests: attempts.length,
                averageScore: Math.round(avgScore),
                totalFlashcards: flashcardsResult.data?.length || 0
            });
        } catch (error: any) {
            toast.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/home')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center">
                            <Brain size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-1">Exam Preparation</h1>
                            <p className="text-slate-400">Practice tests, flashcards & study analytics</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="text-blue-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Tests Taken</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalTests}</p>
                    </div>

                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="text-yellow-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Average Score</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.averageScore}%</p>
                    </div>

                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="text-purple-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Flashcards</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalFlashcards}</p>
                    </div>
                </div>

                {/* Main Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Practice Tests */}
                    <div
                        onClick={() => router.push('/exam-prep/tests')}
                        className="glass-strong rounded-2xl p-8 hover:border-pink-500/30 transition-all cursor-pointer border border-white/10"
                    >
                        <div className="text-5xl mb-4">📝</div>
                        <h2 className="text-2xl font-bold text-white mb-3">Practice Tests</h2>
                        <p className="text-slate-400 mb-6">
                            Take practice tests to prepare for exams. Track your progress and identify areas for improvement.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300 mb-6">
                            <li className="flex items-center gap-2">
                                <span className="text-pink-400">✓</span>
                                Subject-specific questions
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-pink-400">✓</span>
                                Timed mock exams
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-pink-400">✓</span>
                                Detailed explanations
                            </li>
                        </ul>
                        <button className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all font-medium w-full">
                            Browse Tests →
                        </button>
                    </div>

                    {/* Flashcards */}
                    <div
                        onClick={() => router.push('/exam-prep/flashcards')}
                        className="glass-strong rounded-2xl p-8 hover:border-purple-500/30 transition-all cursor-pointer border border-white/10"
                    >
                        <div className="text-5xl mb-4">🗂️</div>
                        <h2 className="text-2xl font-bold text-white mb-3">Flashcards</h2>
                        <p className="text-slate-400 mb-6">
                            Create and study flashcards for effective memorization. Perfect for vocabulary, formulas, and key concepts.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300 mb-6">
                            <li className="flex items-center gap-2">
                                <span className="text-purple-400">✓</span>
                                Create custom decks
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-400">✓</span>
                                Study mode with flip animations
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-400">✓</span>
                                Track mastery levels
                            </li>
                        </ul>
                        <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-medium w-full">
                            My Flashcards →
                        </button>
                    </div>
                </div>

                {/* Tips Banner */}
                <div className="mt-12 glass-strong rounded-2xl p-6 border-l-4 border-pink-500">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">🎯</div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Study Tips</h3>
                            <ul className="text-slate-400 text-sm space-y-1">
                                <li>• Take practice tests regularly to identify weak areas</li>
                                <li>• Use flashcards for spaced repetition learning</li>
                                <li>• Review explanations for questions you got wrong</li>
                                <li>• Simulate exam conditions with timed tests</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
