'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Book, getCurrentUser } from '@/lib/supabase';
import { exportBooksToPDF } from '@/lib/pdf-export';
import Navbar from '@/components/Navbar';
import BookUploadForm from '@/components/admin/BookUploadForm';
import UserManagement from '@/components/admin/UserManagement';
import ReviewModeration from '@/components/admin/ReviewModeration';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';
import BulkActionsPanel from '@/components/admin/BulkActionsPanel';
import ActivityLogs from '@/components/admin/ActivityLogs';
import toast, { Toaster } from 'react-hot-toast';
import { showError, showSuccess } from '@/lib/toast';
import {
    TrendingUp, TrendingDown, Users, BookOpen, Star, Clock,
    Search, Filter, Download, Edit2, Trash2, Eye, BarChart3,
    Activity, Zap, Award, ChevronRight, Plus, RefreshCw, Trophy
} from 'lucide-react';
import ContestManagement from '@/components/admin/ContestManagement';
import VoiceInput from '@/components/ui/VoiceInput';

export default function AdminPage() {
    const [user, setUser] = useState<any>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalUsers: 0,
        topGenre: '',
        recentBooks: 0,
        totalReviews: 0,
        activeUsers: 0,
        growth: 0,
    });
    const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'users' | 'reviews' | 'contests' | 'logs'>('overview');
    const [bookFilter, setBookFilter] = useState<'all' | 'new' | 'featured'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        initializePage();
    }, []);

    useEffect(() => {
        filterBooks();
    }, [searchTerm, bookFilter, books]);

    const initializePage = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/home');
                return;
            }

            setUser(currentUser);
            await fetchData();
            setLoading(false);
        } catch (error) {
            console.error('Error initializing admin page:', error);
            showError('Failed to load admin panel');
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setRefreshing(true);
        try {
            // Fetch books
            const { data: booksData } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            setBooks(booksData || []);

            // Fetch users count
            const { data: usersData, count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact' });

            // Fetch reviews count
            const { count: reviewsCount } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true });

            // Calculate stats
            const genreCounts: { [key: string]: number } = {};

            booksData?.forEach(book => {
                genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
            });

            const topGenre = Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentBooks = booksData?.filter(
                book => new Date(book.created_at) >= thirtyDaysAgo
            ).length || 0;

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const activeUsers = usersData?.filter(
                user => user.updated_at && new Date(user.updated_at) >= sevenDaysAgo
            ).length || 0;

            setStats({
                totalBooks: booksData?.length || 0,
                totalUsers: usersCount || 0,
                topGenre,
                recentBooks,
                totalReviews: reviewsCount || 0,
                activeUsers,
                growth: recentBooks > 0 ? ((recentBooks / (booksData?.length || 1)) * 100) : 0,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to fetch admin data');
        } finally {
            setRefreshing(false);
        }
    };

    const filterBooks = () => {
        let filtered = books;

        // Filter by tab
        if (bookFilter === 'new') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            filtered = filtered.filter(book => new Date(book.created_at) >= sevenDaysAgo);
        } else if (bookFilter === 'featured') {
            filtered = filtered.filter(book => book.is_featured);
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                book =>
                    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.author.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredBooks(filtered);
    };

    const handleDeleteBook = async (bookId: string) => {
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('books')
                .delete()
                .eq('id', bookId);

            if (error) throw error;

            setBooks(prev => prev.filter(b => b.id !== bookId));
            showSuccess('Book deleted successfully');
        } catch (error) {
            showError('Failed to delete book');
        }
    };

    const handleToggleFeatured = async (bookId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('books')
                .update({ is_featured: !currentStatus })
                .eq('id', bookId);

            if (error) throw error;

            setBooks(prev =>
                prev.map(b => (b.id === bookId ? { ...b, is_featured: !currentStatus } : b))
            );
            showSuccess(currentStatus ? 'Removed from featured' : 'Added to featured');
        } catch (error) {
            showError('Failed to update book');
        }
    };

    const handleExportPDF = () => {
        const filename = `admin-books-report-${Date.now()}.pdf`;
        exportBooksToPDF(filteredBooks, filename);
        showSuccess('Report downloaded!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading Admin Panel...</p>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, change, icon: Icon, trend, color }: any) => (
        <div className="group relative glass-strong rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon size={28} className="text-white" />
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-green-500/20 text-green-400' : trend === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : <Activity size={14} />}
                            <span className="text-xs font-semibold">{change}%</span>
                        </div>
                    )}
                </div>

                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm text-slate-400">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-page">
            <Toaster position="top-right" />
            <Navbar role="admin" currentPage="/admin" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                    <Award size={24} className="text-white" />
                                </div>
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-300">
                                Manage your TomeSphere platform
                            </p>
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={refreshing}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'books', label: 'Books', icon: BookOpen, count: stats.totalBooks },
                        { id: 'users', label: 'Users', icon: Users, count: stats.totalUsers },
                        { id: 'reviews', label: 'Reviews', icon: Star },
                        { id: 'contests', label: 'Contests', icon: Trophy },
                        { id: 'logs', label: 'Actions', icon: Activity },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 font-medium ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'glass text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-slideIn">
                        {/* Real-Time Analytics Dashboard */}
                        <AnalyticsDashboard />

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard
                                title="Total Books"
                                value={stats.totalBooks}
                                change={stats.growth.toFixed(1)}
                                trend="up"
                                icon={BookOpen}
                                color="from-indigo-600 to-indigo-700"
                            />
                            <StatCard
                                title="Total Users"
                                value={stats.totalUsers}
                                change={((stats.activeUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}
                                trend="up"
                                icon={Users}
                                color="from-purple-600 to-purple-700"
                            />
                            <StatCard
                                title="Active Users (7d)"
                                value={stats.activeUsers}
                                change={((stats.activeUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}
                                trend="up"
                                icon={Activity}
                                color="from-green-600 to-green-700"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Add New Book */}
                            <div className="glass-strong rounded-2xl p-8 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                        <Plus size={20} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Add New Book</h2>
                                </div>
                                <BookUploadForm onBookAdded={fetchData} />
                            </div>

                            {/* Quick Stats */}
                            <div className="glass-strong rounded-2xl p-8 border border-white/10">
                                <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                                                <Zap size={20} className="text-white" />
                                            </div>
                                            <span className="text-slate-300">Top Genre</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.topGenre}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                                                <Clock size={20} className="text-white" />
                                            </div>
                                            <span className="text-slate-300">New Books (30d)</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.recentBooks}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center">
                                                <Star size={20} className="text-white" />
                                            </div>
                                            <span className="text-slate-300">Featured Books</span>
                                        </div>
                                        <span className="text-white font-semibold">
                                            {books.filter(b => b.is_featured).length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'books' && (
                    <div className="space-y-6 animate-slideIn">
                        {/* Bulk Actions Panel */}
                        <BulkActionsPanel
                            books={filteredBooks}
                            selectedBooks={selectedBooks}
                            onSelectionChange={setSelectedBooks}
                            onBooksUpdated={fetchData}
                        />

                        {/* Filters */}
                        <div className="glass-strong rounded-2xl p-6 border border-white/10">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search books by title or author..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <VoiceInput onTranscript={setSearchTerm} />
                                    </div>
                                </div>

                                {/* Export */}
                                <button
                                    onClick={handleExportPDF}
                                    className="btn btn-accent flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Download size={18} />
                                    Export PDF
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 mt-4">
                                {[
                                    { id: 'all', label: 'All Books', count: books.length },
                                    {
                                        id: 'new', label: 'New (7d)', count: books.filter(b => {
                                            const sevenDaysAgo = new Date();
                                            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                            return new Date(b.created_at) >= sevenDaysAgo;
                                        }).length
                                    },
                                    { id: 'featured', label: 'Featured', count: books.filter(b => b.is_featured).length },
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setBookFilter(filter.id as any)}
                                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${bookFilter === filter.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {filter.label}
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${bookFilter === filter.id ? 'bg-white/20' : 'bg-white/10'
                                            }`}>
                                            {filter.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Books Grid */}
                        <div className="glass-strong rounded-2xl p-6 border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-6">
                                Books ({filteredBooks.length})
                            </h3>

                            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 styled-scrollbar">
                                {filteredBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        className="group bg-white/5 rounded-xl p-5 flex items-center gap-5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
                                    >
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedBooks.includes(book.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedBooks([...selectedBooks, book.id]);
                                                } else {
                                                    setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                                                }
                                            }}
                                            className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer"
                                        />

                                        {/* Cover */}
                                        <img
                                            src={book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                                            alt={book.title}
                                            className="w-16 h-20 object-cover rounded-lg shadow-lg"
                                        />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-semibold flex items-center gap-2 mb-1">
                                                {book.title}
                                                {book.is_featured && (
                                                    <span className="text-yellow-400 text-sm">⭐</span>
                                                )}
                                            </h4>
                                            <p className="text-sm text-slate-400 mb-2">{book.author}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded text-xs font-medium">
                                                    {book.genre}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => router.push(`/books/${book.id}`)}
                                                className="p-2 bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleFeatured(book.id, book.is_featured)}
                                                className={`p-2 rounded-lg transition-colors ${book.is_featured
                                                    ? 'bg-yellow-600/30 text-yellow-300 hover:bg-yellow-600/50'
                                                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                                                    }`}
                                                title={book.is_featured ? 'Unfeature' : 'Feature'}
                                            >
                                                <Star size={18} fill={book.is_featured ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBook(book.id)}
                                                className="p-2 bg-red-600/30 text-red-300 hover:bg-red-600/50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredBooks.length === 0 && (
                                <div className="text-center py-12">
                                    <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No books found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="glass-strong rounded-2xl p-6 border border-white/10 animate-slideIn">
                        <UserManagement />
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="glass-strong rounded-2xl p-6 border border-white/10 animate-slideIn">
                        <ReviewModeration />
                    </div>
                )}

                {activeTab === 'contests' && (
                    <div className="animate-slideIn">
                        <ContestManagement />
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="animate-slideIn">
                        <ActivityLogs />
                    </div>
                )}
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .styled-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .styled-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                .styled-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.5);
                    border-radius: 4px;
                }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.7);
                }
            `}</style>
        </div>
    );
}
