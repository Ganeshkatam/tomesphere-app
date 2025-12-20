'use client';

import { useEffect, useState } from 'react';
import { getViewHistory, clearViewHistory, ViewHistoryItem } from '@/lib/view-history';
import BookCard from './BookCard';
import { Clock, X } from 'lucide-react';

export default function RecentlyViewed() {
    const [history, setHistory] = useState<ViewHistoryItem[]>([]);

    useEffect(() => {
        setHistory(getViewHistory());
    }, []);

    if (history.length === 0) return null;

    const handleClear = () => {
        clearViewHistory();
        setHistory([]);
    };

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Clock className="text-primary" size={24} />
                    <h2 className="text-2xl font-display font-bold">Recently Viewed</h2>
                </div>
                <button
                    onClick={handleClear}
                    className="text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                >
                    <X size={16} />
                    Clear History
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {history.slice(0, 10).map((item) => (
                    <BookCard
                        key={item.book.id}
                        book={item.book}
                        isLiked={false}
                        userRating={0}
                    />
                ))}
            </div>
        </div>
    );
}
