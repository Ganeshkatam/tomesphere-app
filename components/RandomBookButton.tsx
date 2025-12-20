'use client';

import { useState } from 'react';
import { Book } from '@/lib/supabase';
import { getRandomBook } from '@/lib/random-book';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RandomBookButtonProps {
    books: Book[];
    selectedGenres?: string[];
}

export default function RandomBookButton({ books, selectedGenres = [] }: RandomBookButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    const handleClick = () => {
        const randomBook = getRandomBook(books, selectedGenres);

        if (randomBook) {
            setIsAnimating(true);

            // Animate for 1 second then navigate
            setTimeout(() => {
                router.push(`/books/${randomBook.id}`);
            }, 1000);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isAnimating || books.length === 0}
            className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${isAnimating
                    ? 'scale-110 animate-pulse'
                    : 'hover:scale-105'
                } ${books.length === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/50'
                }`}
        >
            <span className="flex items-center gap-2">
                <Sparkles
                    size={20}
                    className={isAnimating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}
                />
                <span>{isAnimating ? 'Finding magic...' : 'Surprise Me!'}</span>
            </span>

            {/* Glow effect */}
            {!isAnimating && books.length > 0 && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300 -z-10" />
            )}
        </button>
    );
}
