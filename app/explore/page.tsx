'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Book, getCurrentUser } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import BackButton from '@/components/BackButton';
import toast, { Toaster } from 'react-hot-toast';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Search, Filter, Globe, ArrowUpDown, X } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';

export default function ExplorePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [user, setUser] = useState<any>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

    // Initialize state from URL params if available
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');

    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'title'>('newest');
    const [genres, setGenres] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [userRatings, setUserRatings] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedGenre, selectedLanguage, sortBy, books]);

    // Update URL when filters change (optional, but good for shareability)
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedGenre) params.set('genre', selectedGenre);

        // Update URL without full reload
        const newUrl = `/explore?${params.toString()}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }, [searchTerm, selectedGenre]);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            // Fetch books
            const { data: booksData, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBooks(booksData || []);

            // Get unique genres and languages
            const uniqueGenres = Array.from(new Set(booksData?.map(b => b.genre) || []));
            const uniqueLangs = Array.from(new Set(booksData?.map(b => b.language) || []));
            setGenres(uniqueGenres);
            setLanguages(uniqueLangs);

            if (currentUser) {
                // Fetch user's likes
                const { data: likesData } = await supabase
                    .from('likes')
                    .select('book_id')
                    .eq('user_id', currentUser.id);
                setUserLikes(new Set(likesData?.map(l => l.book_id) || []));

                // Fetch user's ratings
                const { data: ratingsData } = await supabase
                    .from('ratings')
                    .select('book_id, rating')
                    .eq('user_id', currentUser.id);
                const ratingsMap = new Map();
                ratingsData?.forEach(r => ratingsMap.set(r.book_id, r.rating));
                setUserRatings(ratingsMap);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load books');
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...books];

        // Search
        if (searchTerm) {
            filtered = filtered.filter(book =>
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Genre filter
        if (selectedGenre && selectedGenre !== 'All Genres') {
            filtered = filtered.filter(book =>
                (book.genre || '').toLowerCase() === (selectedGenre || '').toLowerCase()
            );
        }

        // Language filter
        if (selectedLanguage && selectedLanguage !== 'All Languages') {
            filtered = filtered.filter(book => book.language === selectedLanguage);
        }

        // Sort
        if (sortBy === 'title') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        // 'popular' sort would need more data, assuming default for now

        setFilteredBooks(filtered);
    };

    const handleLike = async (bookId: string) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const isLiked = userLikes.has(bookId);
            if (isLiked) {
                await supabase.from('likes').delete().eq('book_id', bookId).eq('user_id', user.id);
                setUserLikes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(bookId);
                    return newSet;
                });
                toast.success('Removed from likes');
            } else {
                await supabase.from('likes').insert({ book_id: bookId, user_id: user.id });
                setUserLikes(prev => new Set(prev).add(bookId));
                toast.success('Added to likes!');
            }
        } catch (error) {
            toast.error('Failed to update like');
        }
    };

    const handleRate = async (bookId: string, rating: number) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            await supabase.from('ratings').upsert({
                book_id: bookId,
                user_id: user.id,
                rating
            });
            setUserRatings(prev => new Map(prev).set(bookId, rating));
            toast.success(`Rated ${rating} stars!`);
        } catch (error) {
            toast.error('Failed to rate');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page pb-20">
            <Toaster position="top-right" />
            <Navbar role={user?.role || 'user'} currentPage="/explore" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Header */}
                <FadeIn className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                        Explore <span className="gradient-text">Thousands</span> of Books
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Discover your next favorite read from our curated collection, featuring diverse genres and timeless classics.
                    </p>
                </FadeIn>

                {/* Advanced Search & Filters */}
                <SlideUp className="glass-strong rounded-3xl p-6 mb-10 border border-white/10 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Search */}
                        <div className="lg:col-span-2 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title, author, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-500"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <VoiceInput onTranscript={setSearchTerm} />
                            </div>
                        </div>

                        {/* Genre Filter */}
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-3.5 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-slate-900">All Genres</option>
                                {genres.map(genre => (
                                    <option key={genre} value={genre} className="bg-slate-900">{genre}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                        </div>

                        {/* Language Filter */}
                        <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-3.5 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-slate-900">All Languages</option>
                                {languages.map(lang => (
                                    <option key={lang} value={lang} className="bg-slate-900">{lang}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-2 text-slate-400 font-medium whitespace-nowrap">
                            <ArrowUpDown size={16} />
                            <span>Sort by:</span>
                        </div>
                        <div className="flex gap-2 w-full overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            {[
                                { value: 'newest', label: 'Newest Arrivals' },
                                { value: 'popular', label: 'Most Popular' },
                                { value: 'title', label: 'Title (A-Z)' },
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setSortBy(option.value as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${sortBy === option.value
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </SlideUp>

                {/* Results Count & Clear */}
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-400">
                        Showing <span className="text-white font-medium">{filteredBooks.length}</span> results
                    </p>

                    {(searchTerm || selectedGenre || selectedLanguage) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedGenre('');
                                setSelectedLanguage('');
                            }}
                            className="text-primary-light hover:text-white transition-colors flex items-center gap-2 text-sm font-medium bg-white/5 px-4 py-2 rounded-full hover:bg-white/10"
                        >
                            <X size={14} />
                            <span>Clear all filters</span>
                        </button>
                    )}
                </div>

                {/* Books Grid */}
                {filteredBooks.length === 0 ? (
                    <FadeIn>
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                            <div className="text-6xl mb-6 opacity-50">🔍</div>
                            <h3 className="text-2xl font-bold text-white mb-2">No books found</h3>
                            <p className="text-slate-400 mb-6">Try adjusting your search terms or removing some filters</p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedGenre('');
                                    setSelectedLanguage('');
                                }}
                                className="btn-primary"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </FadeIn>
                ) : (
                    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
                        {filteredBooks.map((book) => (
                            <StaggerItem key={book.id}>
                                <div className="h-full transform hover:-translate-y-2 transition-transform duration-300">
                                    <BookCard
                                        book={book}
                                        onLike={() => handleLike(book.id)}
                                        onRate={(rating) => handleRate(book.id, rating)}
                                        onAddToList={() => { }}
                                        isLiked={userLikes.has(book.id)}
                                        userRating={userRatings.get(book.id) || 0}
                                    />
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                )}
            </div>
        </div>
    );
}
