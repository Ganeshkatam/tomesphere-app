import { useState, useEffect } from 'react';
import { supabase, Book as BookType } from '@/lib/supabase';
import { generateAIRecommendations, getTrendingBooks } from '@/lib/ai-recommendations';
import BookCard from '@/components/BookCard';
import { showError, showSuccess } from '@/lib/toast';
import { Search, BookOpen, Sparkles, Flame, Telescope } from 'lucide-react';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/motion';

interface AdminDiscoverProps {
    user: any;
}

export default function AdminDiscover({ user }: AdminDiscoverProps) {
    const [books, setBooks] = useState<BookType[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('All');
    const [genres, setGenres] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'for_you' | 'trending'>('all');
    const [recommendations, setRecommendations] = useState<BookType[]>([]);
    const [trending, setTrending] = useState<BookType[]>([]);
    const [userLikes, setUserLikes] = useState<string[]>([]);
    const [userRatings, setUserRatings] = useState<Record<string, number>>({});

    useEffect(() => {
        initializeData();
    }, []);

    useEffect(() => {
        filterBooks();
    }, [searchQuery, selectedGenre, books, activeTab]);

    const initializeData = async () => {
        try {
            setLoading(true);

            // Fetch books
            const { data: booksData, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (booksData) {
                setBooks(booksData);
                setFilteredBooks(booksData);

                // Extract unique genres
                const uniqueGenres = ['All', ...Array.from(new Set(booksData.map(b => b.genre)))];
                setGenres(uniqueGenres);

                // Get AI Recommendations
                if (user) {
                    const recs = await generateAIRecommendations(user.id, booksData);
                    setRecommendations(recs);
                }

                // Get Trending
                const trend = await getTrendingBooks();
                setTrending(trend);
            }

            // Fetch user interactions
            if (user) {
                const { data: likes } = await supabase
                    .from('likes')
                    .select('book_id')
                    .eq('user_id', user.id);

                if (likes) {
                    setUserLikes(likes.map(l => l.book_id));
                }

                const { data: ratings } = await supabase
                    .from('reviews')
                    .select('book_id, rating')
                    .eq('user_id', user.id);

                if (ratings) {
                    const ratingMap: Record<string, number> = {};
                    ratings.forEach(r => {
                        ratingMap[r.book_id] = r.rating;
                    });
                    setUserRatings(ratingMap);
                }
            }

        } catch (error) {
            console.error('Error loading discovery data:', error);
            showError('Failed to load books');
        } finally {
            setLoading(false);
        }
    };

    const filterBooks = () => {
        let result = [];

        switch (activeTab) {
            case 'for_you':
                result = recommendations;
                break;
            case 'trending':
                result = trending;
                break;
            default:
                result = books;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
        }

        if (selectedGenre !== 'All') {
            result = result.filter(book => book.genre === selectedGenre);
        }

        setFilteredBooks(result);
    };

    const handleLike = async (bookId: string) => {
        if (!user) return;

        const isLiked = userLikes.includes(bookId);
        try {
            if (isLiked) {
                await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('book_id', bookId);
                setUserLikes(prev => prev.filter(id => id !== bookId));
                showSuccess('Removed from favorites');
            } else {
                await supabase
                    .from('likes')
                    .insert({ user_id: user.id, book_id: bookId });
                setUserLikes(prev => [...prev, bookId]);
                showSuccess('Added to favorites');
            }
        } catch (error) {
            showError('Failed to update like');
        }
    };

    const handleRate = async (bookId: string, rating: number) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('reviews')
                .upsert({
                    user_id: user.id,
                    book_id: bookId,
                    rating,
                    comment: '' // Optional: could add comment modal later
                }, { onConflict: 'user_id, book_id' });

            if (error) throw error;

            setUserRatings(prev => ({ ...prev, [bookId]: rating }));
            showSuccess(`Rated ${rating} stars!`);
        } catch (error) {
            showError('Failed to submit rating');
        }
    };

    const handleAddToList = async (bookId: string, status: 'want_to_read' | 'currently_reading' | 'finished') => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('reading_list')
                .upsert({
                    user_id: user.id,
                    book_id: bookId,
                    status
                }, { onConflict: 'user_id, book_id' });

            if (error) throw error;

            const statusLabels = {
                'want_to_read': 'Want to Read',
                'currently_reading': 'Currently Reading',
                'finished': 'Finished'
            };
            showSuccess(`Added to ${statusLabels[status]}`);
        } catch (error) {
            showError('Failed to update reading list');
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Search */}
            <FadeIn>
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-3 tracking-tight">Discover Books</h2>
                        <p className="text-slate-400 text-lg max-w-2xl">Explore our vast library, trending titles, and personalized recommendations.</p>
                    </div>

                    <div className="w-full md:w-96 relative group z-10">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search titles, authors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-500 shadow-lg backdrop-blur-md"
                            />
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Filters & Tabs */}
            <SlideUp>
                <div className="glass-strong rounded-3xl p-3 flex flex-col xl:flex-row gap-4 items-center justify-between border border-white/10">
                    <div className="flex w-full xl:w-auto gap-2 p-1 bg-black/20 rounded-2xl overflow-x-auto no-scrollbar">
                        {[
                            { id: 'all', label: 'All Books', icon: <BookOpen size={18} /> },
                            { id: 'for_you', label: 'For You', icon: <Sparkles size={18} /> },
                            { id: 'trending', label: 'Trending', icon: <Flame size={18} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 px-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 no-scrollbar">
                        <span className="text-sm text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap sticky left-0 bg-transparent pl-2 xl:pl-0">Filter by:</span>
                        {genres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${selectedGenre === genre
                                    ? 'bg-white text-black border-white shadow-glow'
                                    : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>
            </SlideUp>

            {/* Books Grid */}
            {loading ? (
                <div className="flex justify-center py-32">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.map((book) => (
                        <StaggerItem key={book.id}>
                            <div className="h-full">
                                <BookCard
                                    book={book}
                                    isLiked={userLikes.includes(book.id)}
                                    userRating={userRatings[book.id] || 0}
                                    onLike={() => handleLike(book.id)}
                                    onRate={(rating) => handleRate(book.id, rating)}
                                    onAddToList={(status) => handleAddToList(book.id, status)}
                                />
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}

            {!loading && filteredBooks.length === 0 && (
                <FadeIn>
                    <div className="text-center py-20 glass rounded-3xl border border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Telescope className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No books found</h3>
                        <p className="text-slate-400">Try adjusting your search or filters to find what you're looking for.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                            className="mt-6 text-primary hover:text-primary-light transition-colors font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                </FadeIn>
            )}
        </div>
    );
}
