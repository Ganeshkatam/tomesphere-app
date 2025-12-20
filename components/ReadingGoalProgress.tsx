'use client';

import { useState, useEffect } from 'react';
import { getReadingGoal, createReadingGoal, ReadingGoal, calculateProgress, getProjectedFinish } from '@/lib/reading-goals';
import { Target, TrendingUp, Edit2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReadingGoalProgressProps {
    userId?: string;
}

export default function ReadingGoalProgress({ userId }: ReadingGoalProgressProps) {
    const [goal, setGoal] = useState<ReadingGoal | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [targetInput, setTargetInput] = useState('50');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadGoal();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const loadGoal = async () => {
        if (!userId) return;
        const data = await getReadingGoal(userId);
        setGoal(data);
        if (data) {
            setTargetInput(data.target_books.toString());
        }
        setLoading(false);
    };

    const handleCreateGoal = async () => {
        if (!userId) return;
        const target = parseInt(targetInput) || 50;
        const newGoal = await createReadingGoal(userId, target);
        if (newGoal) {
            setGoal(newGoal);
            setIsEditing(false);
        }
    };

    const progress = goal ? calculateProgress(goal.books_read, goal.target_books) : 0;
    const projected = goal ? getProjectedFinish(goal.books_read, goal.target_books) : '';

    if (loading) {
        return <div className="glass-card rounded-2xl p-6 mb-8 animate-pulse h-48" />;
    }

    if (!goal && !isEditing) {
        return (
            <div className="glass-card rounded-2xl p-6 mb-8">
                <div className="text-center py-8">
                    <Target className="mx-auto mb-4 text-primary" size={48} />
                    <h3 className="text-xl font-display font-bold mb-2">Set Your Reading Goal</h3>
                    <p className="text-slate-400 mb-6">
                        Challenge yourself! How many books will you read this year?
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary"
                    >
                        Set Goal
                    </button>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="glass-card rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-display font-bold mb-4">Set Your {new Date().getFullYear()} Reading Goal</h3>
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none"
                        placeholder="50"
                        min="1"
                    />
                    <button
                        onClick={handleCreateGoal}
                        className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-light transition-colors flex items-center gap-2"
                    >
                        <Check size={20} />
                        Save
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    if (!goal) return null;

    return (
        <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Target className="text-primary" size={28} />
                    <h2 className="text-2xl font-display font-bold">{new Date().getFullYear()} Reading Goal</h2>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <Edit2 size={20} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{goal.books_read} / {goal.target_books}</span>
                    <span className="text-lg font-medium text-primary">{progress}%</span>
                </div>

                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-400" size={20} />
                        <span className="text-sm text-slate-400">Remaining</span>
                    </div>
                    <div className="text-2xl font-bold">{Math.max(0, goal.target_books - goal.books_read)}</div>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-blue-400" size={20} />
                        <span className="text-sm text-slate-400">Status</span>
                    </div>
                    <div className="text-sm font-medium">{projected}</div>
                </div>
            </div>

            {/* Motivational Message */}
            {progress >= 100 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center"
                >
                    <p className="text-green-400 font-medium">🎉 Goal Achieved! Congratulations!</p>
                </motion.div>
            )}
        </div>
    );
}
