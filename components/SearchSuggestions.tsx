'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Book, User, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Suggestion {
    type: 'book' | 'author' | 'genre';
    text: string;
    id?: string; // Book ID if it's a book
}

interface SearchSuggestionsProps {
    query: string;
    onSelect?: (suggestion: string, type: 'book' | 'author' | 'genre', id?: string) => void;
    className?: string;
}

export default function SearchSuggestions({ query, onSelect, className = '' }: SearchSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query || query.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                // Parallel queries to get a mix of results
                const [booksResponse, genresResponse] = await Promise.all([
                    // 1. Search Titles & Authors
                    supabase
                        .from('books')
                        .select('id, title, author, genre')
                        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
                        .limit(5),

                    // 2. Search Unique Genres (Simulated here by fetching matching books and extracting genres, 
                    // since we don't have a dedicated genres table, or we can use the distinct query if supported perfectly)
                    // A simpler way for genres if they are hardcoded is checking the ALL_GENRES list, 
                    // but let's assume we want DB backed genres. 
                    // For now, let's just use the books query to extract authors/genres to keep it efficient.
                    Promise.resolve({ data: [], error: null })
                ]);

                if (booksResponse.error) throw booksResponse.error;

                const rawBooks = booksResponse.data || [];
                const newSuggestions: Suggestion[] = [];

                // specific book matches
                rawBooks.forEach(book => {
                    // Title match
                    if (book.title.toLowerCase().includes(query.toLowerCase())) {
                        newSuggestions.push({ type: 'book', text: book.title, id: book.id });
                    }
                    // Author match (deduplicate if possible)
                    if (book.author && book.author.toLowerCase().includes(query.toLowerCase())) {
                        if (!newSuggestions.find(s => s.text === book.author && s.type === 'author')) {
                            newSuggestions.push({ type: 'author', text: book.author });
                        }
                    }
                });

                // Add some genre matches from static list or inferred? 
                // Let's rely on passed prop or simple static check if we want comprehensive genre search
                // For now, let's just stick to what we found in DB

                setSuggestions(newSuggestions.slice(0, 6));

            } catch (err) {
                console.error('Error fetching suggestions:', err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    if (!query || (suggestions.length === 0 && !loading)) return null;

    return (
        <div className={`absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden ${className}`}>
            {loading ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                    <div className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Looking for ideas...
                </div>
            ) : (
                <ul className="py-2">
                    {suggestions.map((item, idx) => (
                        <li key={idx}>
                            <button
                                onClick={() => {
                                    if (onSelect) {
                                        onSelect(item.text, item.type, item.id);
                                    } else {
                                        // Default behavior if no handler
                                        if (item.type === 'book' && item.id) {
                                            router.push(`/books/${item.id}`);
                                        } else {
                                            // Propagate to search result page
                                            // This part usually handled by parent calling router.push
                                        }
                                    }
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 text-left transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    {item.type === 'book' && <Book size={14} />}
                                    {item.type === 'author' && <User size={14} />}
                                    {item.type === 'genre' && <Tag size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-200 font-medium group-hover:text-white truncate">
                                        {item.text}
                                    </p>
                                    <p className="text-xs text-slate-500 capitalize">
                                        {item.type}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                    {suggestions.length > 0 && (
                        <li className="border-t border-white/5 mt-1 pt-1">
                            <button
                                onClick={() => onSelect && onSelect(query, 'genre')} // Treat as generic search
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 text-left transition-colors text-xs text-slate-400 hover:text-white"
                            >
                                <Search size={12} />
                                See all results for "{query}"
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
