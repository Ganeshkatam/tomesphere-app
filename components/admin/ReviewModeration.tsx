'use client';

import { useState, useEffect } from 'react';
import { supabase, Review } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';

interface ReviewWithDetails extends Review {
    book_title?: string;
    user_name?: string;
}

export default function ReviewModeration() {
    const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'flagged'>('flagged');

    useEffect(() => {
        fetchReviews();
    }, [filter]);

    const fetchReviews = async () => {
        try {
            let query = supabase
                .from('reviews')
                .select(`
          *,
          books(title),
          profiles(name)
        `)
                .order('created_at', { ascending: false });

            if (filter === 'flagged') {
                query = query.eq('flagged', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            const reviewsWithDetails = data?.map((r: any) => ({
                ...r,
                book_title: r.books?.title,
                user_name: r.profiles?.name,
            })) || [];

            setReviews(reviewsWithDetails);
            setLoading(false);
        } catch (error) {
            showError('Failed to load reviews');
            setLoading(false);
        }
    };

    const toggleFlag = async (reviewId: string, currentFlag: boolean) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ flagged: !currentFlag })
                .eq('id', reviewId);

            if (error) throw error;

            setReviews(prev =>
                prev.map(r => (r.id === reviewId ? { ...r, flagged: !currentFlag } : r))
            );
            showSuccess(currentFlag ? 'Review unflagged' : 'Review flagged');
        } catch (error) {
            showError('Failed to update review');
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            setReviews(prev => prev.filter(r => r.id !== reviewId));
            showSuccess('Review deleted');
        } catch (error) {
            showError('Failed to delete review');
        }
    };

    if (loading) {
        return <div className="spinner mx-auto" />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">Review Moderation</h3>
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-sm font-medium border border-white/5">
                        {reviews.length} Total
                    </span>
                </div>

                <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
                    <button
                        onClick={() => setFilter('flagged')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'flagged'
                            ? 'bg-red-500/10 text-red-400 shadow-sm border border-red-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span>🚩</span> Flagged
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'all'
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span>📝</span> All Reviews
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {reviews.map((review, index) => (
                    <div
                        key={review.id}
                        className={`glass-card rounded-xl p-5 transition-all group border ${review.flagged
                            ? 'bg-red-900/20 border-red-500/30 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.2)]'
                            : 'hover:bg-white/5 border-transparent hover:border-white/10'
                            }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                                    {review.book_title || 'Unknown Book'}
                                    {review.flagged && (
                                        <span className="animate-pulse bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-red-500/20">
                                            Flagged
                                        </span>
                                    )}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                    <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-lg border border-white/5">
                                        👤 {review.user_name || 'Anonymous'}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => toggleFlag(review.id, review.flagged)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${review.flagged
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                        }`}
                                >
                                    {review.flagged ? '✓ Approve' : '🚩 Flag'}
                                </button>
                                <button
                                    onClick={() => deleteReview(review.id)}
                                    className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-all border border-red-500/10 hover:border-red-500/30"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5 text-slate-300 italic">
                            "{review.content}"
                        </div>

                        {review.flagged_reason && (
                            <div className="mt-3 flex items-start gap-2 text-sm text-red-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                <span className="text-lg">⚠️</span>
                                <div>
                                    <span className="font-semibold uppercase text-xs tracking-wider opacity-70 block mb-0.5">Report Reason</span>
                                    {review.flagged_reason}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {reviews.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <span className="text-3xl opacity-50">✨</span>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                        {filter === 'flagged' ? 'No flagged reviews' : 'No reviews found'}
                    </h3>
                    <p className="text-slate-400">Everything looks clean!</p>
                </div>
            )}
        </div>
    );
}
