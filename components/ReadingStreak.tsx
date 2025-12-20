'use client';

import { useEffect, useState } from 'react';
import { getStreakData, StreakData } from '@/lib/streak-tracker';
import { Flame, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReadingStreakProps {
    userId?: string;
}

export default function ReadingStreak({ userId }: ReadingStreakProps) {
    const [streak, setStreak] = useState<StreakData>({
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: '',
        totalDays: 0,
    });

    useEffect(() => {
        loadStreak();
    }, [userId]);

    const loadStreak = async () => {
        const data = await getStreakData(userId);
        setStreak(data);
    };

    return (
        <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <Flame className="text-orange-400" size={28} />
                <h2 className="text-2xl font-display font-bold">Reading Streak</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Current Streak */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30"
                >
                    <div className="flex items-center justify-center mb-3">
                        <Flame className="text-orange-400" size={32} />
                    </div>
                    <div className="text-4xl font-bold text-orange-400 mb-2">
                        {streak.currentStreak}
                    </div>
                    <div className="text-sm text-slate-400">Day Streak</div>
                    {streak.currentStreak > 0 && (
                        <div className="text-xs text-slate-500 mt-2">
                            Keep it going! 🔥
                        </div>
                    )}
                </motion.div>

                {/* Longest Streak */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-6 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                >
                    <div className="flex items-center justify-center mb-3">
                        <Award className="text-yellow-400" size={32} />
                    </div>
                    <div className="text-4xl font-bold text-yellow-400 mb-2">
                        {streak.longestStreak}
                    </div>
                    <div className="text-sm text-slate-400">Best Streak</div>
                    <div className="text-xs text-slate-500 mt-2">
                        Personal record 🏆
                    </div>
                </motion.div>

                {/* Total Days */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                >
                    <div className="flex items-center justify-center mb-3">
                        <Calendar className="text-blue-400" size={32} />
                    </div>
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                        {streak.totalDays}
                    </div>
                    <div className="text-sm text-slate-400">Total Days</div>
                    <div className="text-xs text-slate-500 mt-2">
                        Lifetime reading 📚
                    </div>
                </motion.div>
            </div>

            {/* Motivational Message */}
            {streak.currentStreak === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center"
                >
                    <p className="text-sm text-slate-300">
                        Start your reading journey today! Open a book to begin your streak. 📖
                    </p>
                </motion.div>
            )}
        </div>
    );
}
