'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function TrendingReviews() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase
                .from('reviews')
                .select('*, profiles(username, avatar_url), books(title, cover_url)')
                .gte('rating', 4) // Only show high rated reviews as "Trending"
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setReviews(data.map((r: any) => ({
                    id: r.id,
                    user: r.profiles?.username || 'Anonymous',
                    userAvatar: r.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${r.profiles?.username || 'U'}`,
                    time: new Date(r.created_at).toLocaleDateString(),
                    book: r.books?.title || 'Unknown Book',
                    bookCover: r.books?.cover_url || 'https://via.placeholder.com/150',
                    rating: r.rating,
                    text: r.comment,
                    likes: r.likes_count || 0 // Assuming likes_count exists or we might need to count from a likes table if complex
                })));
            }
        };
        fetchReviews();
    }, []);

    if (reviews.length === 0) return null;

    return (
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">🔥 Trending Reviews This Week</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1))}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        ›
                    </button>
                </div>
            </div>

            <div className="relative overflow-hidden">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {reviews.map((review) => (
                        <div key={review.id} className="min-w-full">
                            <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-xl p-4 border border-white/10">
                                {/* User Info */}
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src={review.userAvatar}
                                        alt={review.user}
                                        className="w-10 h-10 rounded-full ring-2 ring-indigo-500/30"
                                    />
                                    <div>
                                        <p className="font-semibold text-white text-sm">{review.user}</p>
                                        <p className="text-xs text-slate-400">{review.time}</p>
                                    </div>
                                </div>

                                {/* Book & Rating */}
                                <div className="flex gap-4 mb-3">
                                    <img
                                        src={review.bookCover}
                                        alt={review.book}
                                        className="w-16 h-24 object-cover rounded-lg shadow-lg"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-white mb-1">{review.book}</p>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-slate-600'}>
                                                    ⭐
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-300 line-clamp-3">{review.text}</p>
                                    </div>
                                </div>

                                {/* Engagement */}
                                <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                                    <button className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-400 transition-colors">
                                        <span>❤️</span>
                                        <span>{review.likes}</span>
                                    </button>
                                    <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                                        Read Full Review →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
                {reviews.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-indigo-500 w-6' : 'bg-slate-600'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
