'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase, Book, getCurrentUser } from '@/lib/supabase';
import { ALL_GENRES, getGenreConfig, getAllGenres } from '@/lib/genres';
import { generateAIRecommendations, getTrendingBooks } from '@/lib/ai-recommendations';
import { exportBooksToPDF } from '@/lib/pdf-export';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import toast, { Toaster } from 'react-hot-toast';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Search, Filter, BookOpen, Flame, Sparkles, Download, X, Mic } from 'lucide-react';
import OnboardingTour from '@/components/OnboardingTour';

// Lazy load heavy components for better performance
const ReadingStreak = dynamic(() => import('@/components/ReadingStreak'), {
    loading: () => <div className="h-32 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});

const SocialShowcase = dynamic(() => import('@/components/SocialShowcase'), {
    loading: () => <div className="h-96 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});

const StudentSection = dynamic(() => import('@/components/StudentSection'), {
    loading: () => <div className="h-96 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});
const ReadingGoalProgress = dynamic(() => import('@/components/ReadingGoalProgress'), {
    loading: () => <div className="h-32 bg-white/5 animate-pulse rounded-xl" />
});
const RecentlyViewed = dynamic(() => import('@/components/RecentlyViewed'), {
    loading: () => <div className="h-32 bg-white/5 animate-pulse rounded-xl" />
});
const RandomBookButton = dynamic(() => import('@/components/RandomBookButton'));
const CommandPalette = dynamic(() => import('@/components/CommandPalette').then(mod => ({ default: mod.CommandPalette })));


export default function HomePage() {
    const [user, setUser] = useState<any>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [recommendations, setRecommendations] = useState<Book[]>([]);
    const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // Hero search
    const [genreSearch, setGenreSearch] = useState(''); // Genre search
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [genresToShow, setGenresToShow] = useState(15); // Show first 15 genres
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [userRatings, setUserRatings] = useState<Map<string, number>>(new Map());
    const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'recommended'>('all');
    const [loading, setLoading] = useState(true);

    // Personalized collections
    const [wantToReadBooks, setWantToReadBooks] = useState<Book[]>([]);
    const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<Book[]>([]);
    const [favoriteGenreBooks, setFavoriteGenreBooks] = useState<Book[]>([]);
    const [likedBooksRecs, setLikedBooksRecs] = useState<Book[]>([]);
    const [userStats, setUserStats] = useState({ totalLikes: 0, favoriteGenre: '' });
    const [isSearchSticky, setIsSearchSticky] = useState(false);

    const router = useRouter();

    useEffect(() => {
        initializePage();
    }, []);

    // Sticky search bar on scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsSearchSticky(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        filterBooks();
    }, [searchTerm, selectedGenres, books, activeTab]);

    const initializePage = async () => {
        try {
            console.log('Home page: Checking authentication...');

            // Check for session directly
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                console.log('Home page: User logged in:', session.user.email);
                setUser(session.user);
            } else {
                console.log('Home page: No user, showing as guest');
                // Don't redirect - allow guest browsing
            }

            // Fetch books - OPTIMIZED: Load only 20 initially
            try {
                const { data: booksData, error: booksError } = await supabase
                    .from('books')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20); // Load only 20 books initially

                if (booksError) {
                    console.warn('Books fetch error:', booksError);
                } else {
                    setBooks(booksData || []);

                    // Get unique genres from database
                    const dbGenres = Array.from(new Set(booksData?.map(b => b.genre).filter(Boolean) || []));
                    setGenres(dbGenres);
                }
            } catch (e) {
                console.warn('Error fetching books:', e);
            }

            // Fetch user's likes (may not exist yet) - only if logged in
            if (session?.user) {
                try {
                    const { data: likesData } = await supabase
                        .from('likes')
                        .select('book_id')
                        .eq('user_id', session.user.id);
                    setUserLikes(new Set(likesData?.map(l => l.book_id) || []));
                } catch (e) {
                    console.warn('Likes table may not exist:', e);
                }

                // Fetch user's ratings (may not exist yet)
                try {
                    const { data: ratingsData } = await supabase
                        .from('ratings')
                        .select('book_id, rating')
                        .eq('user_id', session.user.id);
                    const ratingsMap = new Map();
                    ratingsData?.forEach(r => ratingsMap.set(r.book_id, r.rating));
                    setUserRatings(ratingsMap);
                } catch (e) {
                    console.warn('Ratings table may not exist:', e);
                }

                // Generate AI recommendations (skip if fails)
                try {
                    if (books.length > 0) {
                        const aiRecs = await generateAIRecommendations(session.user.id, books);
                        setRecommendations(aiRecs);

                        const trending = await getTrendingBooks(10);
                        setTrendingBooks(trending);
                    }
                } catch (e) {
                    console.warn('AI recommendations failed:', e);
                }

                // Fetch personalized collections
                try {
                    // Get reading lists
                    const { data: readingListData } = await supabase
                        .from('reading_lists')
                        .select('book_id, status, books(*)')
                        .eq('user_id', session.user.id);

                    if (readingListData) {
                        const wantToRead = readingListData
                            .filter(item => item.status === 'want_to_read')
                            .map(item => item.books)
                            .filter(Boolean)
                            .slice(0, 4);

                        const currentlyReading = readingListData
                            .filter(item => item.status === 'currently_reading')
                            .map(item => item.books)
                            .filter(Boolean)
                            .slice(0, 4);

                        setWantToReadBooks(wantToRead as unknown as Book[]);
                        setCurrentlyReadingBooks(currentlyReading as unknown as Book[]);
                    }

                    // Get favorite genre from most liked books
                    const { data: likedBooksData } = await supabase
                        .from('likes')
                        .select('book_id, books(genre)')
                        .eq('user_id', session.user.id);

                    if (likedBooksData && likedBooksData.length > 0) {
                        // Find most common genre
                        const genreCounts: { [key: string]: number } = {};
                        likedBooksData.forEach((item: any) => {
                            const genre = item.books?.genre;
                            if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                        });

                        const favGenre = Object.entries(genreCounts)
                            .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

                        // Get books from favorite genre
                        if (favGenre) {
                            const { data: genreBooks } = await supabase
                                .from('books')
                                .select('*')
                                .eq('genre', favGenre)
                                .limit(4);

                            setFavoriteGenreBooks(genreBooks || []);
                        }

                        // Get recommendations based on liked books (same genres)
                        const likedGenres = Array.from(new Set(likedBooksData.map((item: any) => item.books?.genre).filter(Boolean)));
                        if (likedGenres.length > 0) {
                            const { data: similarBooks } = await supabase
                                .from('books')
                                .select('*')
                                .in('genre', likedGenres)
                                .limit(8);

                            // Filter out already liked books
                            const likedIds = new Set(likedBooksData.map(item => item.book_id));
                            const filteredSimilar = similarBooks?.filter(book => !likedIds.has(book.id)) || [];
                            setLikedBooksRecs(filteredSimilar.slice(0, 4));
                        }

                        setUserStats({
                            totalLikes: likedBooksData.length,
                            favoriteGenre: favGenre
                        });
                    }
                } catch (e) {
                    console.warn('Error fetching personalized collections:', e);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Some features may not work properly');
            setLoading(false);
        }
    };

    const filterBooks = () => {
        let filtered = books;

        // Tab-based filtering
        if (activeTab === 'recommended') {
            filtered = recommendations;
        } else if (activeTab === 'trending') {
            filtered = trendingBooks;
        }

        // Search filtering
        if (searchTerm) {
            filtered = filtered.filter(book =>
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Multi-genre filtering
        if (selectedGenres.length > 0) {
            filtered = filtered.filter(book => selectedGenres.includes(book.genre));
        }

        setFilteredBooks(filtered);
    };

    const handleLike = async (bookId: string) => {
        if (!user) return;

        try {
            const isCurrentlyLiked = userLikes.has(bookId);

            if (isCurrentlyLiked) {
                // Unlike
                await supabase
                    .from('likes')
                    .delete()
                    .eq('book_id', bookId)
                    .eq('user_id', user.id);

                setUserLikes(prev => {
                    const newLikes = new Set(prev);
                    newLikes.delete(bookId);
                    return newLikes;
                });
                toast.success('Removed from likes');
            } else {
                // Like
                await supabase
                    .from('likes')
                    .insert({ book_id: bookId, user_id: user.id });

                // Log activity
                await supabase
                    .from('activity_log')
                    .insert({
                        user_id: user.id,
                        action_type: 'like',
                        book_id: bookId,
                    });

                setUserLikes(prev => new Set(prev).add(bookId));
                toast.success('Added to likes!');
            }
        } catch (error) {
            toast.error('Failed to update like');
        }
    };

    const handleRate = async (bookId: string, rating: number) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('ratings')
                .upsert({
                    book_id: bookId,
                    user_id: user.id,
                    rating,
                }, {
                    onConflict: 'user_id,book_id'
                });

            if (error) {
                console.error('Rating error:', error);
                throw error;
            }

            // Log activity
            await supabase
                .from('activity_log')
                .insert({
                    user_id: user.id,
                    action_type: 'rate',
                    book_id: bookId,
                    metadata: { rating },
                });

            setUserRatings(prev => new Map(prev).set(bookId, rating));
            toast.success(`Rated ${rating} stars!`);
        } catch (error: any) {
            console.error('Failed to rate:', error);
            toast.error(error.message || 'Failed to rate book');
        }
    };

    const handleAddToList = async (bookId: string, status: 'want_to_read' | 'currently_reading' | 'finished') => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('reading_lists')
                .upsert({
                    book_id: bookId,
                    user_id: user.id,
                    status,
                });

            if (error) throw error;

            // Log activity
            await supabase
                .from('activity_log')
                .insert({
                    user_id: user.id,
                    action_type: 'add_to_list',
                    book_id: bookId,
                    metadata: { status },
                });

            const statusLabels = {
                want_to_read: 'Want to Read',
                currently_reading: 'Currently Reading',
                finished: 'Finished'
            };
            toast.success(`Added to ${statusLabels[status]}!`);
        } catch (error) {
            toast.error('Failed to add to list');
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setSearchTerm(searchQuery);
            // Scroll to books section
            const booksSection = document.getElementById('all-books-section');
            if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const handleExportPDF = () => {
        if (filteredBooks.length === 0) {
            toast.error('No books to export');
            return;
        }

        const filename = `tomesphere-books-${Date.now()}.pdf`;
        exportBooksToPDF(filteredBooks, filename);
        toast.success('PDF downloaded!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page relative w-full max-w-full mx-auto overflow-x-hidden">
            <OnboardingTour />
            <Toaster position="top-right" />
            <Navbar role={user ? "user" : undefined} currentPage="/home" />

            {/* Sticky Search Bar - Appears on Scroll */}
            {isSearchSticky && (
                <div className="fixed top-0 left-0 right-0 z-50 glass-strong border-b-2 border-indigo-500/30 py-4 px-4 shadow-2xl shadow-indigo-500/20 animate-slideDown">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex gap-3 items-start">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={genreSearch}
                                    onChange={(e) => setGenreSearch(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            setSearchTerm(genreSearch);
                                            const booksSection = document.getElementById('all-books-section');
                                            if (booksSection) booksSection.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    placeholder="Search genres or books..."
                                    className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {genreSearch && (
                                    <button
                                        onClick={() => setGenreSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const genre = e.target.value;
                                        if (genre && !selectedGenres.includes(genre)) {
                                            setSelectedGenres([...selectedGenres, genre]);
                                        }
                                    }}
                                    className="px-4 py-2 pr-8 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer min-w-[160px]"
                                >
                                    <option value="" className="bg-slate-900">Select Genre</option>
                                    <optgroup label="📚 Popular" className="bg-slate-900">
                                        <option value="Fiction" className="bg-slate-900">Fiction</option>
                                        <option value="Non-Fiction" className="bg-slate-900">Non-Fiction</option>
                                        <option value="Romance" className="bg-slate-900">Romance</option>
                                        <option value="Mystery" className="bg-slate-900">Mystery</option>
                                        <option value="Fantasy" className="bg-slate-900">Fantasy</option>
                                    </optgroup>
                                    <optgroup label="🎓 Academic" className="bg-slate-900">
                                        <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                                        <option value="Mathematics" className="bg-slate-900">Mathematics</option>
                                        <option value="Science" className="bg-slate-900">Science</option>
                                        <option value="Business" className="bg-slate-900">Business</option>
                                    </optgroup>
                                </select>
                                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            <button
                                onClick={() => {
                                    setSearchTerm(genreSearch);
                                    const booksSection = document.getElementById('all-books-section');
                                    if (booksSection) booksSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all hover:shadow-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section with Central Search */}
            <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[2000px] pointer-events-none">
                    <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                </div>

                <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <FadeIn className="text-center" delay={0.2}>
                        {/* Welcome badge with user info */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 hover:bg-white/10 transition-colors cursor-default">
                            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-sm font-medium text-slate-300">
                                {user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'Discover Your Next Read'}
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold mb-6 leading-[1.1] tracking-tight">
                            <span className="text-balance text-white drop-shadow-sm">Find Books That</span>
                            <br />
                            <span className="bg-gradient-to-r from-primary-light via-accent to-secondary bg-clip-text gradient-text drop-shadow-lg">
                                Inspire You
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl mb-10 text-balance max-w-2xl mx-auto leading-relaxed text-slate-400">
                            {user ? 'Explore personalized recommendations and discover your next favorite book' : 'Your personalized reading journey awaits'}
                        </p>

                        {/* Central Search Bar */}
                        <SlideUp className="w-full max-w-4xl mx-auto mb-12" delay={0.4}>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl opacity-25 group-hover:opacity-50 blur transition duration-1000 group-hover:duration-200" />

                                <div className="relative flex flex-col md:flex-row gap-4 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
                                    <div className="relative flex-1 group/input">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <span className="text-2xl opacity-50 text-slate-400 group-focus-within/input:text-primary transition-colors">🔍</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search titles, authors, or topics..."
                                            className="w-full h-14 pl-14 pr-14 bg-white/5 border border-white/5 rounded-xl text-lg text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all"
                                        />
                                        {/* Microphone Button */}
                                        <button
                                            onClick={() => {
                                                // Voice search functionality
                                                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                                                    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                                                    const recognition = new SpeechRecognition();
                                                    recognition.lang = 'en-US';
                                                    recognition.continuous = false;
                                                    recognition.interimResults = false;

                                                    recognition.onresult = (event: any) => {
                                                        const transcript = event.results[0][0].transcript;
                                                        setSearchQuery(transcript);
                                                        setSearchTerm(transcript);
                                                    };

                                                    recognition.onerror = (event: any) => {
                                                        console.error('Speech recognition error:', event.error);
                                                    };

                                                    recognition.start();
                                                } else {
                                                    alert('Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.');
                                                }
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-primary transition-all group/mic"
                                            title="Voice search"
                                        >
                                            <Mic size={20} className="group-hover/mic:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        className="h-14 px-8 btn-primary text-lg font-semibold shadow-glow hover:shadow-glow-lg active:scale-95 whitespace-nowrap"
                                    >
                                        Explore
                                    </button>
                                </div>
                            </div>
                        </SlideUp>

                        {/* Genre Chips - Landing Page Style */}
                        <SlideUp delay={0.6}>
                            <div id="genre-section" className="mt-8">
                                {/* Search Bar with Dropdown */}
                                <div className="max-w-2xl mx-auto mb-6 relative">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={genreSearch}
                                            onChange={(e) => setGenreSearch(e.target.value)}
                                            placeholder="Search and select genres..."
                                            className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                                        />
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {genreSearch && (
                                            <button
                                                onClick={() => setGenreSearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        )}

                                        {/* Dropdown Suggestion Box */}
                                        {genreSearch && (
                                            <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50">
                                                <div className="p-2">
                                                    <p className="text-xs text-slate-400 px-3 py-2">
                                                        {getAllGenres().filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length} genres found - Click to select
                                                    </p>
                                                    {getAllGenres()
                                                        .filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()))
                                                        .slice(0, 20)
                                                        .map((genre) => {
                                                            const isSelected = selectedGenres.includes(genre);
                                                            return (
                                                                <button
                                                                    key={genre}
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setSelectedGenres(selectedGenres.filter(g => g !== genre));
                                                                        } else {
                                                                            setSelectedGenres([...selectedGenres, genre]);
                                                                        }
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${isSelected
                                                                        ? 'bg-indigo-600/30 text-white border border-indigo-500/50'
                                                                        : 'hover:bg-white/5 text-slate-300'
                                                                        }`}
                                                                >
                                                                    <span>{genre}</span>
                                                                    {isSelected && <span className="text-green-400">✓</span>}
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <p className="text-base text-slate-300 font-semibold">📚 {selectedGenres.length > 0 ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected` : `Browse by Genre`}</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto mb-4">
                                    {getAllGenres().filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).slice(0, genresToShow).map((genre) => {
                                        const isSelected = selectedGenres.includes(genre);
                                        const { icon } = getGenreConfig(genre);
                                        return (
                                            <button
                                                key={genre}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedGenres(selectedGenres.filter(g => g !== genre));
                                                    } else {
                                                        setSelectedGenres([...selectedGenres, genre]);
                                                    }
                                                }}
                                                className={`group px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 border-2 backdrop-blur-md relative overflow-hidden ${isSelected
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-2xl shadow-indigo-500/50 scale-105'
                                                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15 hover:border-primary/40 hover:text-white hover:scale-105'
                                                    }`}
                                            >
                                                {/* Glow effect */}
                                                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isSelected ? 'bg-white/10' : 'bg-gradient-to-r from-primary/20 to-secondary/20'
                                                    }`} />

                                                <span className="relative flex items-center gap-2">
                                                    <span className="text-lg">{icon}</span>
                                                    <span>{genre}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {selectedGenres.length > 0 && (
                                        <button
                                            onClick={() => setSelectedGenres([])}
                                            title="Clear filters"
                                            className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-md bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30 hover:border-red-500/50"
                                        >
                                            Clear ({selectedGenres.length})
                                        </button>
                                    )}
                                </div>

                                {/* Load More / Show Less Buttons */}
                                <div className="flex justify-center gap-3 mt-4">
                                    {genresToShow < getAllGenres().filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length && (
                                        <button
                                            onClick={() => setGenresToShow(prev => Math.min(prev + 5, getAllGenres().length))}
                                            className="px-6 py-2 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all text-sm font-medium"
                                        >
                                            Load 5 More ({getAllGenres().filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length - genresToShow} remaining)
                                        </button>
                                    )}
                                    {genresToShow > 15 && (
                                        <button
                                            onClick={() => setGenresToShow(15)}
                                            className="px-6 py-2 rounded-full bg-slate-600/20 hover:bg-slate-600/30 text-slate-300 border border-slate-500/30 transition-all text-sm font-medium"
                                        >
                                            Show Less ▲
                                        </button>
                                    )}
                                </div>
                            </div>
                        </SlideUp>
                    </FadeIn>
                </div>
            </section>

            {/* Personalized Sections - Authenticated Users Only */}
            {user && (recommendations.length > 0 || trendingBooks.length > 0) && (
                <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* For You - AI Recommendations */}
                    {recommendations.length > 0 && (
                        <FadeIn className="mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
                                        <Sparkles className="inline-block mr-2" size={32} />
                                        For You
                                    </h2>
                                    <p className="text-slate-400">Personalized picks based on your reading preferences</p>
                                </div>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {recommendations.slice(0, 4).map((book) => (
                                    <StaggerItem key={book.id}>
                                        <BookCard
                                            book={book}
                                            onLike={() => handleLike(book.id)}
                                            onRate={(rating) => handleRate(book.id, rating)}
                                            onAddToList={(status) => handleAddToList(book.id, status)}
                                            isLiked={userLikes.has(book.id)}
                                            userRating={userRatings.get(book.id) || 0}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </FadeIn>
                    )}

                    {/* Trending Books */}
                    {trendingBooks.length > 0 && (
                        <FadeIn className="mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
                                        <Flame className="inline-block mr-2" size={32} />
                                        Trending Now
                                    </h2>
                                    <p className="text-slate-400">Popular books in the TomeSphere community</p>
                                </div>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {trendingBooks.slice(0, 4).map((book) => (
                                    <StaggerItem key={book.id}>
                                        <BookCard
                                            book={book}
                                            onLike={() => handleLike(book.id)}
                                            onRate={(rating) => handleRate(book.id, rating)}
                                            onAddToList={(status) => handleAddToList(book.id, status)}
                                            isLiked={userLikes.has(book.id)}
                                            userRating={userRatings.get(book.id) || 0}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </FadeIn>
                    )}

                    {/* Currently Reading */}
                    {currentlyReadingBooks.length > 0 && (
                        <FadeIn className="mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
                                        📖 Continue Your Journey
                                    </h2>
                                    <p className="text-slate-400">Pick up where you left off</p>
                                </div>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {currentlyReadingBooks.map((book) => (
                                    <StaggerItem key={book.id}>
                                        <BookCard
                                            book={book}
                                            onLike={() => handleLike(book.id)}
                                            onRate={(rating) => handleRate(book.id, rating)}
                                            onAddToList={(status) => handleAddToList(book.id, status)}
                                            isLiked={userLikes.has(book.id)}
                                            userRating={userRatings.get(book.id) || 0}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </FadeIn>
                    )}

                    {/* Want to Read */}
                    {wantToReadBooks.length > 0 && (
                        <FadeIn className="mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
                                        🎯 On Your Wishlist
                                    </h2>
                                    <p className="text-slate-400">Books you're planning to read</p>
                                </div>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {wantToReadBooks.map((book) => (
                                    <StaggerItem key={book.id}>
                                        <BookCard
                                            book={book}
                                            onLike={() => handleLike(book.id)}
                                            onRate={(rating) => handleRate(book.id, rating)}
                                            onAddToList={(status) => handleAddToList(book.id, status)}
                                            isLiked={userLikes.has(book.id)}
                                            userRating={userRatings.get(book.id) || 0}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </FadeIn>
                    )}

                    {/* Based on Favorite Genre */}
                    {favoriteGenreBooks.length > 0 && userStats.favoriteGenre && (
                        <FadeIn className="mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
                                        💝 More {userStats.favoriteGenre}
                                    </h2>
                                    <p className="text-slate-400">Since you love {userStats.favoriteGenre}, here are more recommendations</p>
                                </div>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {favoriteGenreBooks.map((book) => (
                                    <StaggerItem key={book.id}>
                                        <BookCard
                                            book={book}
                                            onLike={() => handleLike(book.id)}
                                            onRate={(rating) => handleRate(book.id, rating)}
                                            onAddToList={(status) => handleAddToList(book.id, status)}
                                            isLiked={userLikes.has(book.id)}
                                            userRating={userRatings.get(book.id) || 0}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </FadeIn>
                    )}

                    {/* Because You Liked */}
                    {likedBooksRecs.length > 0 && (
                        <FadeIn className="mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
                                        ❤️ Because You're Loving Your Reads
                                    </h2>
                                    <p className="text-slate-400">Based on your {userStats.totalLikes} liked book{userStats.totalLikes !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {likedBooksRecs.map((book) => (
                                    <StaggerItem key={book.id}>
                                        <BookCard
                                            book={book}
                                            onLike={() => handleLike(book.id)}
                                            onRate={(rating) => handleRate(book.id, rating)}
                                            onAddToList={(status) => handleAddToList(book.id, status)}
                                            isLiked={userLikes.has(book.id)}
                                            userRating={userRatings.get(book.id) || 0}
                                        />
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </FadeIn>
                    )}
                </div>
            )}

            {/* Features Showcase */}
            <section className="py-12 sm:py-16 relative">
                <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
                            <span className="text-white">Crafted for the </span>
                            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">True Bibliophile</span>
                        </h2>
                        <p className="text-xl text-slate-400">
                            Experience a reading platform designed with obsession to detail.
                        </p>
                    </FadeIn>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: '🤖', title: 'AI-Powered Curation', desc: 'Our engine learns your taste profile to suggest books you\'ll actually love, not just bestsellers.' },
                            { icon: '🌍', title: 'Universal Access', desc: 'Seamlessly sync your library across all devices. Start on desktop, finish on mobile.' },
                            { icon: '💬', title: 'Vibrant Community', desc: 'Join book clubs, participate in live discussions, and share your literary journey.' },
                            { icon: '📈', title: 'Reading Analytics', desc: 'Visualize your reading habits with beautiful charts. Efficient tracking for the data-minded.' },
                            { icon: '✍️', title: 'Thoughtful Reviews', desc: 'Write rich, formatted reviews and engage with critique from fellow intellectuals.' },
                            { icon: '🎯', title: 'Precision Search', desc: 'Filter by mood, length, complexity, and more to find the perfect book for right now.' }
                        ].map((feature, i) => (
                            <SlideUp key={i} className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:bg-slate-800/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 shadow-md group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10 group-hover:ring-primary/50 group-hover:bg-primary/20">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-display font-bold mb-3 text-white group-hover:text-primary-light transition-colors">{feature.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                                </div>
                            </SlideUp>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* All Books Section */}
            <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text">
                        <BookOpen className="inline-block mr-2" size={32} />
                        {selectedGenres.length > 0 || searchTerm ? 'Search Results' : 'All Books'}
                    </h2>
                    <button
                        onClick={handleExportPDF}
                        className="btn-secondary flex items-center gap-2 px-4 py-2"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>

                {/* View Tabs */}
                <div className="bg-black/20 p-2 rounded-2xl inline-flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'all'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <BookOpen size={18} />
                        All Books
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{books.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'trending'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Flame size={18} />
                        Trending
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{trendingBooks.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('recommended')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'recommended'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Sparkles size={18} />
                        For You
                    </button>
                </div>

                {/* Books Grid */}
                {filteredBooks.length === 0 ? (
                    <FadeIn>
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                            <div className="text-6xl mb-4 opacity-50">🔍</div>
                            <h3 className="text-2xl font-bold text-white mb-2">No books found</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                We couldn't find any books matching your criteria. Try adjusting your search or selecting a different genre.
                            </p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedGenres([]); setActiveTab('all'); }}
                                className="mt-6 text-primary hover:text-primary-light font-medium transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    </FadeIn>
                ) : (
                    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {filteredBooks.map((book) => (
                            <StaggerItem key={book.id}>
                                <div className="h-full">
                                    <BookCard
                                        book={book}
                                        onLike={() => handleLike(book.id)}
                                        onRate={(rating) => handleRate(book.id, rating)}
                                        onAddToList={(status) => handleAddToList(book.id, status)}
                                        isLiked={userLikes.has(book.id)}
                                        userRating={userRatings.get(book.id) || 0}
                                    />
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                )}
            </div>

            {/* Social Community Showcase */}
            <SocialShowcase />

            {/* Student Features Section */}
            <StudentSection />

            {/* Personalized CTA Section */}
            {user && (
                <section className="py-20 sm:py-28 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                    </div>

                    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <FadeIn className="text-center">
                            <h2 className="text-4xl sm:text-6xl font-display font-bold mb-6">
                                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                    Ready to Level Up Your Reading?
                                </span>
                            </h2>
                            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                                {userStats.totalLikes > 0
                                    ? `You've liked ${userStats.totalLikes} book${userStats.totalLikes > 1 ? 's' : ''}! Invite friends to share your journey.`
                                    : 'Complete your profile and unlock personalized features.'}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <a href="/profile" className="btn-primary text-lg px-8 py-4 shadow-glow hover:shadow-glow-lg">
                                    Complete Your Profile
                                </a>
                                <a href="/community" className="btn-secondary text-lg px-8 py-4">
                                    Join Community
                                </a>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary-light mb-2">{userStats.totalLikes}</div>
                                    <div className="text-sm text-slate-400">Books Liked</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-secondary-light mb-2">{recommendations.length}</div>
                                    <div className="text-sm text-slate-400">AI Picks</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-accent mb-2">{currentlyReadingBooks.length}</div>
                                    <div className="text-sm text-slate-400">Reading Now</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary mb-2">{wantToReadBooks.length}</div>
                                    <div className="text-sm text-slate-400">On Wishlist</div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )
            }
        </div >
    );
}


