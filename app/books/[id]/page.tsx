'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Book, getCurrentUser } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, BookOpen, Heart } from 'lucide-react';
import { generateSimpleDescription } from '@/lib/pdf-description-generator';

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // const params = useParams(); // useParams is for Client Components, but page props are passed directly. 
    // However, useParams() is also valid in Client Components. 
    // The issue reported was accessing `params` prop directly without unwrapping.
    // Since this is a Client Component ('use client'), `params` prop is available but is a promise in Next.js 15.

    // Actually, for 'use client' components, useParams() hook is the recommended way if we don't want to deal with Promise props.
    // But since the Page component receives `params` prop, Next.js expects us to handle it if we define it.
    // The previous error was specifically about accessing props.params. 

    // Let's stick to the pattern we used in ChatPage: use(params)

    const { id } = use(params);
    const router = useRouter();
    const bookId = id;

    const [book, setBook] = useState<Book | null>(null);
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'quotes'>('overview');
    const [isLiked, setIsLiked] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
    const [isRead, setIsRead] = useState(false);
    const [audiobookId, setAudiobookId] = useState<string | null>(null);
    const [reviewContent, setReviewContent] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        loadBookDetails();
    }, [bookId]);

    const loadBookDetails = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            // Fetch book
            const { data: bookData, error: bookError } = await supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .single();

            if (bookError) throw bookError;
            setBook(bookData);

            // Fetch ratings
            const { data: ratingsData } = await supabase
                .from('ratings')
                .select('rating')
                .eq('book_id', bookId);

            if (ratingsData && ratingsData.length > 0) {
                const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
                setAvgRating(avg);
                setRatingCount(ratingsData.length);
            }

            if (currentUser) {
                // Check if liked
                const { data: likeData } = await supabase
                    .from('likes')
                    .select('id')
                    .eq('book_id', bookId)
                    .eq('user_id', currentUser.id)
                    .single();
                setIsLiked(!!likeData);

                // Get user's rating
                const { data: userRatingData } = await supabase
                    .from('ratings')
                    .select('rating')
                    .eq('book_id', bookId)
                    .eq('user_id', currentUser.id)
                    .single();
                setUserRating(userRatingData?.rating || 0);
            }

            // Fetch reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*, profiles(name, avatar_url)')
                .eq('book_id', bookId)
                .order('created_at', { ascending: false })
                .limit(10);
            setReviews(reviewsData || []);

            setLoading(false);
        } catch (error) {
            console.error('Error loading book:', error);
            toast.error('Failed to load book');
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            if (isLiked) {
                await supabase.from('likes').delete().eq('book_id', bookId).eq('user_id', user.id);
                setIsLiked(false);
                toast.success('Removed from likes');
            } else {
                await supabase.from('likes').insert({ book_id: bookId, user_id: user.id });
                setIsLiked(true);
                toast.success('Added to likes!');
            }
        } catch (error) {
            toast.error('Failed to update like');
        }
    };

    const handlePostReview = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!reviewContent.trim()) {
            toast.error('Review cannot be empty');
            return;
        }

        setIsSubmittingReview(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                book_id: bookId,
                user_id: user.id,
                content: reviewContent.trim(),
            });

            if (error) throw error;

            toast.success('Review posted!');
            setReviewContent('');
            loadBookDetails(); // Refresh list
        } catch (error) {
            console.error('Error posting review:', error);
            toast.error('Failed to post review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleRate = async (rating: number) => {
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
            setUserRating(rating);
            toast.success(`Rated ${rating} stars!`);
            loadBookDetails(); // Refresh ratings
        } catch (error) {
            toast.error('Failed to rate');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Book Not Found</h1>
                    <button onClick={() => router.push('/home')} className="btn btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page">
            <Toaster position="top-right" />
            <Navbar role={user?.role || 'user'} currentPage="/books" />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back</span>
                </button>

                {/* Admin Actions Shortcut */}
                {user?.role === 'admin' && (
                    <div className="mb-8 p-4 glass-strong rounded-xl border border-indigo-500/30 flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-500/30">
                                👑 Admin Mode
                            </span>
                            <span className="text-slate-300 text-sm">You have manage access to this book.</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/admin')}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                            >
                                Manage in Dashboard
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this book? This cannot be undone.')) return;
                                    try {
                                        toast.loading('Deleting book...');
                                        const { error } = await supabase.from('books').delete().eq('id', book.id);
                                        if (error) throw error;
                                        toast.dismiss();
                                        toast.success('Book deleted');
                                        router.push('/admin');
                                    } catch (e) {
                                        toast.dismiss();
                                        toast.error('Failed to delete book');
                                    }
                                }}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                            >
                                Delete Book
                            </button>
                        </div>
                    </div>
                )}

                {/* Book Header */}
                <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12 animate-fadeIn">
                    {/* Book Cover */}
                    <div className="space-y-4">
                        <div className="card-elevated rounded-2xl overflow-hidden aspect-[2/3] bg-gradient-to-br from-primary/20 to-secondary/20">
                            {book.cover_url ? (
                                <img
                                    src={book.cover_url}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">📚</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => router.push(`/read/${book.id}`)}
                                    className="flex-1 btn btn-primary py-3 rounded-lg flex items-center justify-center gap-2 font-bold"
                                >
                                    <BookOpen size={20} />
                                    Read Book
                                </button>

                                {audiobookId && (
                                    <button
                                        onClick={() => router.push(`/listen/${book.id}`)}
                                        className="flex-1 btn btn-secondary py-3 rounded-lg flex items-center justify-center gap-2 font-bold"
                                    >
                                        <span className="text-xl">🎧</span>
                                        Listen
                                    </button>
                                )}

                                <button
                                    onClick={handleLike}
                                    className={`p-3 rounded-lg border transition-all ${isLiked
                                        ? 'bg-red-500/10 border-red-500 text-red-500'
                                        : 'border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                            <button
                                onClick={async () => {
                                    if (book.pdf_url) {
                                        try {
                                            toast.loading('Preparing download...');
                                            const response = await fetch(book.pdf_url);
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `${book.title}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                            toast.dismiss();
                                            toast.success('Download started!');
                                        } catch {
                                            const link = document.createElement('a');
                                            link.href = book.pdf_url;
                                            link.download = `${book.title}.pdf`;
                                            link.setAttribute('download', '');
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            toast.dismiss();
                                            toast.success('Download started!');
                                        }
                                    } else {
                                        toast.error('Download not available');
                                    }
                                }}
                                className="btn btn-accent w-full"
                            >
                                ⬇️ Download PDF
                            </button>
                            <button className="btn btn-ghost w-full">
                                ➕ Add to Collection
                            </button>
                        </div>
                    </div>

                    {/* Book Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-5xl font-display font-bold mb-3">{book.title}</h1>
                            <p className="text-2xl text-slate-400 mb-4">by {book.author}</p>

                            {/* Rating */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(star)}
                                            className="text-3xl transition-all hover:scale-110"
                                        >
                                            {star <= (userRating || avgRating) ? '⭐' : '☆'}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xl font-semibold">
                                    {avgRating.toFixed(1)}
                                </span>
                                <span className="text-slate-400">({ratingCount} ratings)</span>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="glass px-4 py-2 rounded-full text-sm">
                                    {book.genre}
                                </span>
                                {book.pages && (
                                    <span className="glass px-4 py-2 rounded-full text-sm">
                                        {book.pages} pages
                                    </span>
                                )}
                                {book.language && (
                                    <span className="glass px-4 py-2 rounded-full text-sm">
                                        {book.language}
                                    </span>
                                )}
                                {book.release_date && (
                                    <span className="glass px-4 py-2 rounded-full text-sm">
                                        {new Date(book.release_date).getFullYear()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-white/10">
                            <div className="flex gap-6">
                                {['overview', 'reviews', 'quotes'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`pb-4 px-2 font-semibold capitalize transition-all ${activeTab === tab
                                            ? 'border-b-2 border-primary text-primary-light'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div>
                                        <h3 className="text-xl font-bold mb-3">Description</h3>
                                        <p className="text-slate-300 leading-relaxed">
                                            {book.description || generateSimpleDescription(book.title, book.author)}
                                        </p>
                                    </div>

                                    {book.publisher && (
                                        <div>
                                            <h3 className="text-xl font-bold mb-3">Publisher</h3>
                                            <p className="text-slate-300">{book.publisher}</p>
                                        </div>
                                    )}

                                    {book.isbn && (
                                        <div>
                                            <h3 className="text-xl font-bold mb-3">ISBN</h3>
                                            <p className="text-slate-300 font-mono">{book.isbn}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6 animate-fadeIn">
                                    {/* Review Input */}
                                    {user ? (
                                        <div className="glass p-4 rounded-xl border border-white/5">
                                            <h3 className="text-lg font-bold mb-3">Write a Review</h3>
                                            <textarea
                                                value={reviewContent}
                                                onChange={(e) => setReviewContent(e.target.value)}
                                                placeholder="Share your thoughts about this book..."
                                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-all resize-none mb-3"
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handlePostReview}
                                                    disabled={isSubmittingReview || !reviewContent.trim()}
                                                    className="btn btn-primary px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmittingReview ? 'Posting...' : 'Post Review'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="glass p-6 text-center rounded-xl border border-white/5">
                                            <p className="text-slate-300 mb-4">Please log in to leave a review.</p>
                                            <button onClick={() => router.push('/login')} className="btn btn-secondary">
                                                Log In
                                            </button>
                                        </div>
                                    )}

                                    {/* Reviews List */}
                                    <div className="space-y-4">
                                        {reviews.length > 0 ? (
                                            reviews.map((review) => (
                                                <div key={review.id} className="card">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                                                            {review.profiles?.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{review.profiles?.name || 'Anonymous'}</div>
                                                            <div className="text-sm text-slate-400">
                                                                {new Date(review.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-300">{review.content}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-slate-400">
                                                No reviews yet. Be the first to review!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'quotes' && (
                                <div className="text-center py-12 text-slate-400 animate-fadeIn">
                                    No quotes available yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
