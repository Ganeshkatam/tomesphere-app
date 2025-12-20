'use client';

import { useState } from 'react';
import { Book } from '@/lib/supabase';
import { Download, Upload, Trash2, Star, Tag, CheckSquare, Square } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface BulkActionsPanelProps {
    books: Book[];
    selectedBooks: string[];
    onSelectionChange: (bookIds: string[]) => void;
    onBooksUpdated: () => void;
}

export default function BulkActionsPanel({
    books,
    selectedBooks,
    onSelectionChange,
    onBooksUpdated,
}: BulkActionsPanelProps) {
    const [showGenreSelector, setShowGenreSelector] = useState(false);
    const [newGenre, setNewGenre] = useState('');
    const [processing, setProcessing] = useState(false);

    const genres = [
        'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
        'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
        'Technology', 'Science', 'Philosophy', 'Poetry', 'Drama'
    ];

    // Select/Deselect All
    const handleSelectAll = () => {
        if (selectedBooks.length === books.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(books.map(b => b.id));
        }
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedBooks.length === 0) {
            toast.error('No books selected');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedBooks.length} book(s)? This cannot be undone.`)) {
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('books')
                .delete()
                .in('id', selectedBooks);

            if (error) throw error;

            toast.success(`${selectedBooks.length} book(s) deleted successfully`);
            onSelectionChange([]);
            onBooksUpdated();
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Failed to delete books');
        } finally {
            setProcessing(false);
        }
    };

    // Bulk Feature/Unfeature
    const handleBulkFeature = async (featured: boolean) => {
        if (selectedBooks.length === 0) {
            toast.error('No books selected');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('books')
                .update({ is_featured: featured })
                .in('id', selectedBooks);

            if (error) throw error;

            toast.success(
                `${selectedBooks.length} book(s) ${featured ? 'featured' : 'unfeatured'} successfully`
            );
            onSelectionChange([]);
            onBooksUpdated();
        } catch (error) {
            console.error('Bulk feature error:', error);
            toast.error('Failed to update books');
        } finally {
            setProcessing(false);
        }
    };

    // Bulk Genre Change
    const handleBulkGenreChange = async () => {
        if (selectedBooks.length === 0) {
            toast.error('No books selected');
            return;
        }

        if (!newGenre) {
            toast.error('Please select a genre');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('books')
                .update({ genre: newGenre })
                .in('id', selectedBooks);

            if (error) throw error;

            toast.success(`${selectedBooks.length} book(s) updated to ${newGenre}`);
            onSelectionChange([]);
            setShowGenreSelector(false);
            setNewGenre('');
            onBooksUpdated();
        } catch (error) {
            console.error('Bulk genre change error:', error);
            toast.error('Failed to update genres');
        } finally {
            setProcessing(false);
        }
    };

    // Export Selected to CSV
    const handleExportSelected = () => {
        if (selectedBooks.length === 0) {
            toast.error('No books selected');
            return;
        }

        const selectedBooksData = books.filter(b => selectedBooks.includes(b.id));
        const csv = Papa.unparse(selectedBooksData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `books-export-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${selectedBooks.length} book(s) exported`);
    };

    // Import from CSV
    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setProcessing(true);
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                try {
                    const booksToImport = results.data
                        .filter((row: any) => row.title && row.author)
                        .map((row: any) => ({
                            title: row.title,
                            author: row.author,
                            genre: row.genre || 'Fiction',
                            description: row.description || '',
                            cover_url: row.cover_url || '',
                            pdf_url: row.pdf_url || '',
                            is_featured: row.is_featured === 'true' || row.is_featured === true,
                        }));

                    if (booksToImport.length === 0) {
                        toast.error('No valid books found in CSV');
                        setProcessing(false);
                        return;
                    }

                    const { error } = await supabase
                        .from('books')
                        .insert(booksToImport);

                    if (error) throw error;

                    toast.success(`${booksToImport.length} book(s) imported successfully`);
                    onBooksUpdated();
                } catch (error) {
                    console.error('CSV import error:', error);
                    toast.error('Failed to import books');
                } finally {
                    setProcessing(false);
                    event.target.value = '';
                }
            },
            error: (error) => {
                console.error('CSV parse error:', error);
                toast.error('Failed to parse CSV file');
                setProcessing(false);
                event.target.value = '';
            },
        });
    };

    return (
        <div className="glass-strong rounded-2xl p-6 border border-white/10 mb-6 bg-slate-900/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Selection Info */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white border border-white/5 hover:border-white/10"
                        title={selectedBooks.length === books.length ? 'Deselect All' : 'Select All'}
                    >
                        {selectedBooks.length === books.length ? (
                            <CheckSquare size={18} className="text-indigo-400" />
                        ) : (
                            <Square size={18} className="text-slate-400" />
                        )}
                        <span className="text-sm font-medium">
                            {selectedBooks.length > 0
                                ? `${selectedBooks.length} Selected`
                                : 'Select All'}
                        </span>
                    </button>

                    {selectedBooks.length > 0 && (
                        <div className="text-sm font-medium text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                            {selectedBooks.length} / {books.length} Active
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Delete */}
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedBooks.length === 0 || processing}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl transition-all border border-red-500/10 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Trash2 size={18} className="group-hover:text-red-400" />
                        <span className="text-sm font-medium">Delete</span>
                    </button>

                    {/* Feature */}
                    <button
                        onClick={() => handleBulkFeature(true)}
                        disabled={selectedBooks.length === 0 || processing}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl transition-all border border-amber-500/10 hover:border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Star size={18} className="group-hover:fill-current" />
                        <span className="text-sm font-medium">Feature</span>
                    </button>

                    {/* Unfeature */}
                    <button
                        onClick={() => handleBulkFeature(false)}
                        disabled={selectedBooks.length === 0 || processing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded-xl transition-all border border-slate-600/30 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Star size={18} className="opacity-50" />
                        <span className="text-sm font-medium">Unfeature</span>
                    </button>

                    {/* Change Genre */}
                    <button
                        onClick={() => setShowGenreSelector(!showGenreSelector)}
                        disabled={selectedBooks.length === 0 || processing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl transition-all border border-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Tag size={18} />
                        <span className="text-sm font-medium">Genre</span>
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2"></div>

                    {/* Export */}
                    <button
                        onClick={handleExportSelected}
                        disabled={selectedBooks.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl transition-all border border-emerald-500/10 hover:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        <span className="text-sm font-medium">Export</span>
                    </button>

                    {/* Import */}
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl transition-all border border-blue-500/10 hover:border-blue-500/30 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10">
                        <Upload size={18} />
                        <span className="text-sm font-medium">Import</span>
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls,.json,*/*"
                            onChange={handleImportCSV}
                            className="hidden"
                            disabled={processing}
                        />
                    </label>
                </div>
            </div>

            {/* Genre Selector */}
            {showGenreSelector && (
                <div className="mt-4 p-4 bg-slate-800/80 rounded-xl border border-white/10 animate-fade-in shadow-xl">
                    <div className="flex items-center gap-4">
                        <select
                            value={newGenre}
                            onChange={(e) => setNewGenre(e.target.value)}
                            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 focus:bg-slate-800 transition-all"
                        >
                            <option value="">Select a new genre for selected items...</option>
                            {genres.map((genre) => (
                                <option key={genre} value={genre}>
                                    {genre}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleBulkGenreChange}
                            disabled={!newGenre || processing}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                        >
                            Apply Change
                        </button>
                        <button
                            onClick={() => {
                                setShowGenreSelector(false);
                                setNewGenre('');
                            }}
                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors font-medium border border-white/5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Processing Indicator */}
            {processing && (
                <div className="mt-4 flex items-center justify-center p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />
                    <span className="text-sm font-medium animate-pulse">Processing bulk action...</span>
                </div>
            )}
        </div>
    );
}
