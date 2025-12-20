import { useState } from 'react';
import { Book as BookType } from '@/lib/supabase';
import BookUploadForm from './BookUploadForm';
import { Search, Plus, ArrowLeft, Star, Trash2, Download } from 'lucide-react';

interface BooksManagementProps {
    books: BookType[];
    onDelete: (id: string) => void;
    onToggleFeatured: (id: string, status: boolean) => void;
    onRefresh: () => void;
    onExport: () => void;
}

export default function BooksManagement({ books, onDelete, onToggleFeatured, onRefresh, onExport }: BooksManagementProps) {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'featured' | 'new'>('all');

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'featured') return book.is_featured;
        if (filter === 'new') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(book.created_at) >= sevenDaysAgo;
        }
        return true;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Library Management</h2>
                    <p className="text-slate-400">Manage your book inventory and featured content</p>
                </div>
                <div className="flex gap-3">
                    {view === 'list' ? (
                        <button
                            onClick={() => setView('add')}
                            className="btn-glow px-6 py-3 rounded-xl flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} /> Add New Book
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('list')}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 flex items-center gap-2"
                        >
                            <ArrowLeft size={20} /> Back to List
                        </button>
                    )}
                </div>
            </div>

            {view === 'add' ? (
                <div className="solid-panel rounded-3xl p-8 bg-slate-900">
                    <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Add New Book</h3>
                    <BookUploadForm onBookAdded={() => {
                        onRefresh();
                        setView('list');
                    }} />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="solid-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title or author..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                All Books
                            </button>
                            <button
                                onClick={() => setFilter('featured')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === 'featured'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                <Star size={16} className="inline mr-2" /> Featured
                            </button>
                            <button
                                onClick={() => onExport()}
                                className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                            >
                                <Download size={16} /> Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="solid-panel rounded-3xl overflow-hidden bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-800/50">
                                        <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Book Details</th>
                                        <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Genre</th>
                                        <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredBooks.map((book) => (
                                        <tr key={book.id} className="group hover:bg-slate-800/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                        <img
                                                            src={book.cover_url || 'https://via.placeholder.com/50'}
                                                            alt={book.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white text-lg">{book.title}</div>
                                                        <div className="text-sm text-slate-400">{book.author}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                    {book.genre}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                {book.is_featured ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        Featured
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 text-sm">Standard</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onToggleFeatured(book.id, book.is_featured)}
                                                        className={`p-2.5 rounded-xl transition-all ${book.is_featured
                                                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                            }`}
                                                        title={book.is_featured ? "Remove from Featured" : "Add to Featured"}
                                                    >
                                                        <Star size={16} className={book.is_featured ? "fill-current" : ""} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(book.id)}
                                                        className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                                                        title="Delete Book"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredBooks.length === 0 && (
                            <div className="p-12 text-center">
                                <Search className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-white mb-2">No books found</h3>
                                <p className="text-slate-400">Try adjusting your filters or search terms</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
