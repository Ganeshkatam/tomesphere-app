'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Book } from '@/lib/supabase';
import { generateCitation, generateBibliography, copyToClipboard, CitationFormat } from '@/lib/citations';
import toast from 'react-hot-toast';
import { Copy, Download, BookOpen, ArrowLeft, Save } from 'lucide-react';

export default function CitationsPage() {
    const router = useRouter();
    const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
    const [format, setFormat] = useState<CitationFormat>('apa');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);

    // History & Save States
    const [showHistory, setShowHistory] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [bibTitle, setBibTitle] = useState('');
    const [savedBibliographies, setSavedBibliographies] = useState<any[]>([]);

    useEffect(() => {
        if (showHistory) fetchHistory();
    }, [showHistory]);

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('citations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setSavedBibliographies(data);
    };

    const handleSave = async () => {
        if (!bibTitle.trim()) {
            toast.error('Please enter a title');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please login to save');
            router.push('/login');
            return;
        }

        const { error } = await supabase.from('citations').insert({
            user_id: user.id,
            title: bibTitle,
            books: selectedBooks, // Storing full book objects as JSON
            created_at: new Date().toISOString()
        });

        if (error) {
            toast.error('Failed to save');
        } else {
            toast.success('Bibliography saved!');
            setShowSaveModal(false);
            setBibTitle('');
        }
    };

    const searchBooks = async () => {
        if (!searchTerm.trim()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
                .limit(10);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error: any) {
            toast.error('Failed to search books');
        } finally {
            setLoading(false);
        }
    };

    const addBook = (book: Book) => {
        if (!selectedBooks.find(b => b.id === book.id)) {
            setSelectedBooks([...selectedBooks, book]);
            toast.success('Book added to bibliography');
        }
    };

    const removeBook = (bookId: string) => {
        setSelectedBooks(selectedBooks.filter(b => b.id !== bookId));
    };

    const handleCopy = async () => {
        const bibliography = generateBibliography(selectedBooks, format);
        try {
            await copyToClipboard(bibliography);
            toast.success('Bibliography copied to clipboard!');
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const handleDownload = () => {
        const bibliography = generateBibliography(selectedBooks, format);
        const blob = new Blob([bibliography], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bibliography-${format}.txt`;
        a.click();
        toast.success('Bibliography downloaded!');
    };

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/home')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">Citation Generator</h1>
                    <p className="text-slate-400">Generate citations in APA, MLA, Chicago, or Harvard format</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Search and Add Books */}
                    <div className="glass-strong rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Add Books</h2>

                        {/* Search */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
                                placeholder="Search by title or author..."
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                            />
                            <button
                                onClick={searchBooks}
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50"
                            >
                                Search
                            </button>
                        </div>

                        {/* Search Results */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {searchResults.map(book => (
                                <div
                                    key={book.id}
                                    className="p-3 bg-white/5 rounded-lg flex items-center justify-between hover:bg-white/10 transition-all"
                                >
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm line-clamp-1">{book.title}</p>
                                        <p className="text-slate-400 text-xs">{book.author}</p>
                                    </div>
                                    <button
                                        onClick={() => addBook(book)}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Selected Books and Citations */}
                    <div className="glass-strong rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Bibliography ({selectedBooks.length})</h2>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                                {showHistory ? 'Hide History' : 'View History'}
                            </button>
                        </div>

                        {/* Format Selector */}
                        <div className="flex gap-2 mb-4">
                            {(['apa', 'mla', 'chicago', 'harvard'] as CitationFormat[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${format === f
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Selected Books List */}
                        {!showHistory ? (
                            <>
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                    {selectedBooks.map(book => (
                                        <div key={book.id} className="p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-white text-sm font-medium flex-1">{book.title}</p>
                                                <button
                                                    onClick={() => removeBook(book.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <p className="text-slate-400 text-xs font-mono">
                                                {generateCitation(book, format).replace(/_/g, '')}
                                            </p>
                                        </div>
                                    ))}
                                    {selectedBooks.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            No books selected. Search and add books to generate citations.
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {selectedBooks.length > 0 && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Copy size={18} />
                                            Copy
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download size={18} />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => setShowSaveModal(true)}
                                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} />
                                            Save
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {savedBibliographies.map((bib: any) => (
                                    <div key={bib.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-white font-medium">{bib.title}</p>
                                                <p className="text-xs text-slate-500">{new Date(bib.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedBooks(bib.books);
                                                    setShowHistory(false);
                                                }}
                                                className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded"
                                            >
                                                Load
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400">{bib.books?.length || 0} books</p>
                                    </div>
                                ))}
                                {savedBibliographies.length === 0 && (
                                    <p className="text-center text-slate-500 py-4">No saved bibliographies found.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Modal */}
                {showSaveModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="glass-strong rounded-2xl p-6 max-w-sm w-full relative">
                            <h3 className="text-lg font-bold text-white mb-4">Save Bibliography</h3>
                            <input
                                type="text"
                                value={bibTitle}
                                onChange={(e) => setBibTitle(e.target.value)}
                                placeholder="Bibliography Name"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white mb-4 focus:outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Format Guide */}
                <div className="mt-6 glass-strong rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-3">Citation Format Guide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-indigo-400 font-medium mb-1">APA (7th Edition)</p>
                            <p className="text-slate-400">Author, A. A. (Year). <em>Title of work</em>. Publisher.</p>
                        </div>
                        <div>
                            <p className="text-indigo-400 font-medium mb-1">MLA (9th Edition)</p>
                            <p className="text-slate-400">Author. <em>Title</em>. Publisher, Year.</p>
                        </div>
                        <div>
                            <p className="text-indigo-400 font-medium mb-1">Chicago (17th Edition)</p>
                            <p className="text-slate-400">Author. <em>Title</em>. Publisher, Year.</p>
                        </div>
                        <div>
                            <p className="text-indigo-400 font-medium mb-1">Harvard</p>
                            <p className="text-slate-400">Author (Year) <em>Title</em>. Publisher.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
