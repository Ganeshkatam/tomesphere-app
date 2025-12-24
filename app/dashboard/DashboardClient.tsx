'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser, Book } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { showError } from '@/lib/toast';

interface DashboardData {
    likedBooks: Book[];
    ratedBooks: Array<{ book: Book; rating: number }>;
    comments: Array<{ book: Book; content: string; created_at: string }>;
    readingList: Array<{ book: Book; status: string; updated_at: string }>;
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<DashboardData>({
        likedBooks: [],
        ratedBooks: [],
        comments: [],
        readingList: [],
    });
    const [stats, setStats] = useState({
        totalLikes: 0,
        totalRatings: 0,
        totalComments: 0,
        booksInList: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'likes' | 'ratings' | 'comments' | 'reading'>('likes');
    const router = useRouter();

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            // Fetch liked books
            const { data: likes } = await supabase
                .from('likes')
                .select('book_id, books(*)')
                .eq('user_id', currentUser.id);

            const likedBooks = (likes?.map((l: any) => l.books).filter(Boolean) || []) as Book[];

            // Fetch ratings with books
            const { data: ratings } = await supabase
                .from('ratings')
                .select('book_id, rating, books(*)')
                .eq('user_id', currentUser.id)
                .order('updated_at', { ascending: false });

            const ratedBooks = (ratings?.map((r: any) => ({
                book: r.books as unknown as Book,
                rating: r.rating,
            })).filter(r => r.book) || []);

            // Fetch comments with books
            const { data: comments } = await supabase
                .from('comments')
                .select('book_id, content, created_at, books(*)')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(10);

            const userComments = (comments?.map((c: any) => ({
                book: c.books as unknown as Book,
                content: c.content,
                created_at: c.created_at,
            })).filter(c => c.book) || []);

            // Fetch reading list
            const { data: readingList } = await supabase
                .from('reading_lists')
                .select('book_id, status, updated_at, books(*)')
                .eq('user_id', currentUser.id)
                .order('updated_at', { ascending: false });

            const userReadingList = (readingList?.map((r: any) => ({
                book: r.books as unknown as Book,
                status: r.status,
                updated_at: r.updated_at,
            })).filter(r => r.book) || []);

            setData({
                likedBooks,
                ratedBooks,
                comments: userComments,
                readingList: userReadingList,
            });

            setStats({
                totalLikes: likedBooks.length,
                totalRatings: ratedBooks.length,
                totalComments: userComments.length,
                booksInList: userReadingList.length,
            });

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showError('Failed to load dashboard');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    const hasActivity = stats.totalLikes > 0 || stats.totalRatings > 0 || stats.totalComments > 0 || stats.booksInList > 0;

    return (
        <div className="min-h-screen bg-gradient-page">
            {/* <Toaster position="top-right" /> */}
            <Navbar role="user" currentPage="/dashboard" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fadeIn">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        My Dashboard
                    </h1>
                    <p className="text-slate-300">
                        Track your reading activity and preferences
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slideIn">
                    <div className="glass rounded-xl p-6">
                        <div className="text-3xl mb-2">❤️</div>
                        <div className="text-2xl font-bold text-white">{stats.totalLikes}</div>
                        <div className="text-sm text-slate-400">Liked Books</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-2xl font-bold text-white">{stats.totalRatings}</div>
                        <div className="text-sm text-slate-400">Ratings Given</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-3xl mb-2">💬</div>
                        <div className="text-2xl font-bold text-white">{stats.totalComments}</div>
                        <div className="text-sm text-slate-400">Comments</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-3xl mb-2">📚</div>
                        <div className="text-2xl font-bold text-white">{stats.booksInList}</div>
                        <div className="text-sm text-slate-400">Reading List</div>
                    </div>
                </div>

                {!hasActivity ? (
                    <div className="glass-strong rounded-2xl p-12 text-center">
                        <div className="text-6xl mb-4">📖</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            No Activity Yet
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Start exploring books to see your activity here
                        </p>
                        <a
                            href="/home"
                            className="btn-primary inline-block"
                        >
                            Discover Books
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            <button
                                onClick={() => setActiveTab('likes')}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === 'likes'
                                    ? 'bg-indigo-600 text-white'
                                    : 'glass text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                ❤️ Liked ({stats.totalLikes})
                            </button>
                            <button
                                onClick={() => setActiveTab('ratings')}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === 'ratings'
                                    ? 'bg-indigo-600 text-white'
                                    : 'glass text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                ⭐ Ratings ({stats.totalRatings})
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === 'comments'
                                    ? 'bg-indigo-600 text-white'
                                    : 'glass text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                💬 Comments ({stats.totalComments})
                            </button>
                            <button
                                onClick={() => setActiveTab('reading')}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === 'reading'
                                    ? 'bg-indigo-600 text-white'
                                    : 'glass text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                📚 Reading List ({stats.booksInList})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="glass-strong rounded-2xl p-6">
                            {activeTab === 'likes' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.likedBooks.map(book => (
                                        <div key={book.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
                                            <h3 className="text-white font-semibold mb-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-sm text-slate-400">{book.author}</p>
                                            <span className="inline-block mt-2 px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded text-xs">
                                                {book.genre}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'ratings' && (
                                <div className="space-y-3">
                                    {data.ratedBooks.map(({ book, rating }) => (
                                        <div key={book.id} className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                                            <img
                                                src={book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                                                alt={book.title}
                                                className="w-16 h-20 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold mb-1">{book.title}</h3>
                                                <p className="text-sm text-slate-400">{book.author}</p>
                                            </div>
                                            <div className="flex text-yellow-400">
                                                {Array.from({ length: rating }).map((_, i) => (
                                                    <span key={i}>⭐</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <div className="space-y-4">
                                    {data.comments.map((comment, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="text-white font-semibold">{comment.book.title}</h4>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-300">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'reading' && (
                                <div className="space-y-3">
                                    {data.readingList.map((item) => (
                                        <div key={item.book.id} className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                                            <img
                                                src={item.book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                                                alt={item.book.title}
                                                className="w-16 h-20 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold mb-1">{item.book.title}</h3>
                                                <p className="text-sm text-slate-400">{item.book.author}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'finished'
                                                ? 'bg-green-600/30 text-green-300'
                                                : item.status === 'currently_reading'
                                                    ? 'bg-blue-600/30 text-blue-300'
                                                    : 'bg-yellow-600/30 text-yellow-300'
                                                }`}>
                                                {item.status === 'finished' && '✅ Finished'}
                                                {item.status === 'currently_reading' && '📖 Reading'}
                                                {item.status === 'want_to_read' && '📚 Want to Read'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
