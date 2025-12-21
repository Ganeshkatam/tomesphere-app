'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, Book } from '@/lib/supabase';
import BookCard from '@/components/BookCard';
import Navbar from '@/components/Navbar';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Loader2, Search as SearchIcon, X, Mic } from 'lucide-react';
import SearchSuggestions from '@/components/SearchSuggestions';
import VoiceInput from '@/components/ui/VoiceInput';

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL Params
    const initialQuery = searchParams.get('q') || '';
    const initialGenre = searchParams.get('genre') || '';

    // State
    const [query, setQuery] = useState(initialQuery);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalResults, setTotalResults] = useState(0);

    // Sync state with URL if it changes externally
    useEffect(() => {
        setQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const fetchBooks = async (searchTerm: string, genreFilter: string) => {
        setLoading(true);
        try {
            let dbQuery = supabase
                .from('books')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                dbQuery = dbQuery.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`);
            }

            if (genreFilter) {
                dbQuery = dbQuery.ilike('genre', `%${genreFilter}%`);
            }

            const { data, error, count } = await dbQuery;

            if (error) throw error;

            setBooks(data || []);
            setTotalResults(count || 0);
        } catch (err) {
            console.error('Error searching books:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchBooks(initialQuery, initialGenre);
    }, [initialQuery, initialGenre]);

    const handleSearch = (newQuery: string) => {
        // Update URL to trigger fetch via useEffect
        const params = new URLSearchParams(searchParams.toString());
        if (newQuery) {
            params.set('q', newQuery);
        } else {
            params.delete('q');
        }
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-[#0f0f16] text-slate-200 font-sans selection:bg-indigo-500/30">
            <Navbar currentPage="/search" />

            <div className="pt-24 pb-12 w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search Header */}
                <FadeIn className="mb-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative group z-30">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl shadow-2xl">
                                <div className="pl-4 text-slate-400">
                                    <SearchIcon size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    // Make Enter key trigger the URL update explicitly if desired, 
                                    // but for now let's rely on button or Suggestion selection.
                                    // Or debounced input? 
                                    // Let's stick to "Explicit Trigger" as per previous user request.
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch(query);
                                    }}
                                    placeholder="Search titles, authors, genres..."
                                    className="w-full bg-transparent border-none text-white px-4 py-4 focus:ring-0 focus:outline-none text-lg placeholder:text-slate-500"
                                />
                                <div className="flex items-center gap-2 mr-2">
                                    {query && (
                                        <button
                                            onClick={() => {
                                                setQuery('');
                                                handleSearch(''); // Should show all books
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                    <VoiceInput
                                        onTranscript={(text) => {
                                            setQuery(text);
                                            // Handle search immediately or let user confirm? 
                                            // User requested "redirections and their buttons", voice usually auto-fills.
                                            // Let's just fill for now.
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSearch(query)}
                                    className="mr-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
                                >
                                    Search
                                </button>

                                <SearchSuggestions
                                    query={query}
                                    onSelect={(text, type, id) => {
                                        if (type === 'book' && id) {
                                            router.push(`/books/${id}`);
                                        } else {
                                            setQuery(text);
                                            handleSearch(text);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {loading ? (
                            <Loader2 className="animate-spin text-primary" size={24} />
                        ) : (
                            <span>
                                {books.length > 0 ? (
                                    <>
                                        Found <span className="text-primary">{totalResults}</span> results
                                        {(initialQuery || initialGenre) && <span className="text-slate-400 text-lg font-normal ml-2">for "{initialQuery || initialGenre}"</span>}
                                    </>
                                ) : (
                                    "No results found"
                                )}
                            </span>
                        )}
                    </h1>
                </div>

                {/* Results Grid */}
                {!loading && books.length === 0 ? (
                    <FadeIn>
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                            <div className="text-6xl mb-4 opacity-50">🔍</div>
                            <h3 className="text-2xl font-bold text-white mb-2">No matching books</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-6">
                                We couldn't find any books matching "{initialQuery || initialGenre}". Try adjusting your keywords.
                            </p>
                            <button
                                onClick={() => handleSearch('')}
                                className="text-primary hover:text-primary-light font-medium transition-colors"
                            >
                                Browse All Books
                            </button>
                        </div>
                    </FadeIn>
                ) : (
                    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {books.map((book) => (
                            <StaggerItem key={book.id}>
                                <BookCard
                                    book={book}
                                    // Minimal props for search view, assuming auth state handled internally or passed if needed
                                    // BookCard usually needs like handlers. 
                                    // For simplicity in this step, let's pass dummies or standard handlers if we have context.
                                    // Wait, BookCard uses userLikes, etc. 
                                    // We might need to fetch user likes here if we want that functionality.
                                    // For now, let's allow BookCard to handle its own display, pass defaults.
                                    // Ideally we lift state like HomeClient, but for now let's just make it render.
                                    isLiked={false}
                                    onLike={() => { }} // Placeholder
                                    onRate={() => { }}
                                    onAddToList={() => { }}
                                    userRating={0}
                                />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0f0f16] flex items-center justify-center text-white">Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
