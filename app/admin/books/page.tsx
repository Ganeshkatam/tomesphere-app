'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Book } from '@/lib/supabase';
import { exportBooksToPDF } from '@/lib/pdf-export';
import BookUploadForm from '@/components/admin/BookUploadForm';
import BulkActionsPanel from '@/components/admin/BulkActionsPanel';
import { showError, showSuccess } from '@/lib/toast';
import {
    BookOpen,
    Search,
    Download,
    Eye,
    Trash2,
    Star,
    Plus,
    RefreshCw
} from 'lucide-react';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { logAdminAction } from '@/lib/audit';

export default function BooksManagement() {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [bookFilter, setBookFilter] = useState<'all' | 'new' | 'featured'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchBooks();
    }, []);

    useEffect(() => {
        filterBooks();
    }, [searchTerm, bookFilter, books]);

    const fetchBooks = async () => {
        setRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBooks(data || []);
        } catch (error) {
            console.error('Error fetching books:', error);
            showError('Failed to load books');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterBooks = () => {
        let filtered = books;

        // Filter by type
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

            await logAdminAction('DELETE_BOOK', `Deleted book ID: ${bookId}`);
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

            await logAdminAction('UPDATE_BOOK', `Toggled featured status for book ID: ${bookId} to ${!currentStatus}`);
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
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <AdminAuthGuard>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Book Management</h1>
                        <p className="text-slate-400">Manage all books, uploads, and featured content.</p>
                    </div>
                    <button
                        onClick={fetchBooks}
                        disabled={refreshing}
                        className="btn btn-secondary flex items-center gap-2 w-fit"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Add New Book Section */}
                <div className="glass-strong rounded-2xl p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                            <Plus size={20} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Add New Book</h2>
                    </div>
                    <BookUploadForm onBookAdded={fetchBooks} />
                </div>

                {/* Bulk Actions Panel */}
                <BulkActionsPanel
                    books={filteredBooks}
                    selectedBooks={selectedBooks}
                    onSelectionChange={setSelectedBooks}
                    onBooksUpdated={fetchBooks}
                />

                {/* Filters & Content */}
                <div className="glass-strong rounded-2xl p-6 border border-white/10">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search books by title or author..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
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
                    <div className="flex gap-2 mb-6">
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

                    <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 styled-scrollbar">
                        {filteredBooks.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No books found matching criteria</p>
                            </div>
                        ) : (
                            filteredBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="group bg-white/5 rounded-xl p-4 flex items-center gap-5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
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
                                        className="w-12 h-16 object-cover rounded-lg shadow-lg"
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-semibold flex items-center gap-2 mb-1 truncate">
                                            {book.title}
                                            {book.is_featured && (
                                                <span className="text-yellow-400 text-xs bg-yellow-400/10 px-1.5 py-0.5 rounded">Featured</span>
                                            )}
                                        </h4>
                                        <p className="text-sm text-slate-400 mb-1">{book.author}</p>
                                        <span className="inline-block px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded text-xs font-medium">
                                            {book.genre}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/books/${book.id}`)}
                                            className="p-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 rounded-lg transition-colors"
                                            title="View"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleFeatured(book.id, book.is_featured)}
                                            className={`p-2 rounded-lg transition-colors ${book.is_featured
                                                ? 'bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                }`}
                                            title={book.is_featured ? 'Unfeature' : 'Feature'}
                                        >
                                            <Star size={16} fill={book.is_featured ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBook(book.id)}
                                            className="p-2 bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <style jsx>{`
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
        </AdminAuthGuard>
    );
}
