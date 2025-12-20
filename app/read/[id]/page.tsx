'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Bookmark, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sun, Moon, Volume2, VolumeX, Settings, Menu, X, List } from 'lucide-react';

interface Book {
    id: string;
    title: string;
    author: string;
    description?: string;
    cover_url?: string;
    content?: string;
    total_pages?: number;
    pdf_url?: string;
}

interface BookmarkItem {
    id: string;
    page_number: number;
    label?: string;
    created_at: string;
}

export default function ReadingPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = params.id as string;

    const [book, setBook] = useState<Book | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [fontSize, setFontSize] = useState(18);
    const [darkMode, setDarkMode] = useState(true);
    const [isReading, setIsReading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'info' | 'bookmarks' | 'settings'>('info');
    const [readingProgress, setReadingProgress] = useState(0);

    // Reading settings
    const [lineHeight, setLineHeight] = useState(1.8);
    const [fontFamily, setFontFamily] = useState('serif');

    useEffect(() => {
        fetchBook();
        loadReadingProgress();
        loadBookmarks();
    }, [bookId]);

    useEffect(() => {
        // Save reading progress & check bookmark status
        if (book && currentPage) {
            saveReadingProgress();
            checkCurrentPageBookmark();
        }
    }, [currentPage, bookmarks]); // Re-check when bookmarks list changes

    const fetchBook = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .single();

            if (error) throw error;

            setBook(data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load book');
            setLoading(false);
        }
    };

    const loadBookmarks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('bookmarks')
                .select('*')
                .eq('user_id', user.id)
                .eq('book_id', bookId)
                .order('page_number', { ascending: true });

            setBookmarks(data || []);
        } catch (error) {
            console.error('Error loading bookmarks');
        }
    };

    const checkCurrentPageBookmark = () => {
        const exists = bookmarks.some(b => b.page_number === currentPage);
        setIsBookmarked(exists);
    };

    const loadReadingProgress = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('reading_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('book_id', bookId)
                .single();

            if (data) {
                setCurrentPage(data.current_page || 1);
                setReadingProgress(data.progress_percentage || 0);
            }
        } catch (error) {
            console.log('No previous progress found');
        }
    };

    const saveReadingProgress = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const totalPages = book?.total_pages || 100;
            const progress = (currentPage / totalPages) * 100;
            const isFinished = progress >= 100;

            // 1. Update Reading Progress (Details)
            await supabase.from('reading_progress').upsert({
                user_id: user.id,
                book_id: bookId,
                current_page: currentPage,
                progress_percentage: progress,
                last_read_at: new Date().toISOString()
            });

            // 2. Update Reading List Status (Library)
            // This ensures the book appears in "Currently Reading" or "Finished" tabs
            const status = isFinished ? 'finished' : 'currently_reading';
            await supabase.from('reading_lists').upsert({
                user_id: user.id,
                book_id: bookId,
                status: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, book_id' }); // Ensure uniqueness if constraint exists

            setReadingProgress(progress);

            // Award points if finished
            if (isFinished) {
                const { awardPoints } = await import('@/lib/gamification');
                const points = await awardPoints(user.id, 'bookRead');
                if (points > 0) toast.success(`🎉 Completed! +${points} XP`);
            }
        } catch (error) {
            console.error('Failed to save progress', error);
        }
    };

    const toggleBookmark = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (isBookmarked) {
                await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('book_id', bookId)
                    .eq('page_number', currentPage);
                toast.success('Bookmark removed');
            } else {
                await supabase.from('bookmarks').insert({
                    user_id: user.id,
                    book_id: bookId,
                    page_number: currentPage,
                    label: `Page ${currentPage}`
                });
                toast.success('Page bookmarked');
            }
            loadBookmarks(); // Reload list
        } catch (error) {
            toast.error('Failed to bookmark');
        }
    };

    const speak = () => {
        if ('speechSynthesis' in window) {
            if (isReading) {
                window.speechSynthesis.cancel();
                setIsReading(false);
            } else {
                const utterance = new SpeechSynthesisUtterance(getPageContent());
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.onend = () => setIsReading(false);
                window.speechSynthesis.speak(utterance);
                setIsReading(true);
            }
        } else {
            toast.error('Text-to-speech not supported');
        }
    };

    const getPageContent = () => {
        // Simulate page content (in real app, this would come from the book's actual pages)
        const content = book?.content || 'This is sample book content. ';
        const wordsPerPage = 300;
        const start = (currentPage - 1) * wordsPerPage;
        const end = start + wordsPerPage;
        const words = content.split(' ');
        return words.slice(start, end).join(' ');
    };

    const totalPages = book?.total_pages || 100;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
            }`}>

            {/* Sidebar (Drawer) */}
            <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Reader Menu</h2>
                        <button onClick={() => setShowSidebar(false)} className="p-2 text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setSidebarTab('info')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'info' ? 'text-primary bg-white/5' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Info
                        </button>
                        <button
                            onClick={() => setSidebarTab('bookmarks')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'bookmarks' ? 'text-primary bg-white/5' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Bookmarks
                        </button>
                        <button
                            onClick={() => setSidebarTab('settings')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'settings' ? 'text-primary bg-white/5' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Settings
                        </button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {sidebarTab === 'info' && book && (
                            <div className="space-y-6">
                                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg mx-auto w-32">
                                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white mb-1">{book.title}</h3>
                                    <p className="text-sm text-slate-400">{book.author}</p>
                                </div>
                                <div className="text-sm text-slate-300">
                                    <p>{book.description}</p>
                                </div>
                            </div>
                        )}

                        {sidebarTab === 'bookmarks' && (
                            <div className="space-y-2">
                                {bookmarks.length > 0 ? (
                                    bookmarks.map((b) => (
                                        <button
                                            key={b.id}
                                            onClick={() => {
                                                setCurrentPage(b.page_number);
                                                setShowSidebar(false);
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                                        >
                                            <span className="text-slate-300 group-hover:text-white">Page {b.page_number}</span>
                                            <span className="text-xs text-slate-500">{new Date(b.created_at).toLocaleDateString()}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-500 py-8">
                                        No bookmarks yet
                                    </div>
                                )}
                            </div>
                        )}

                        {sidebarTab === 'settings' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Font Size</label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-white"><ZoomOut size={16} /></button>
                                        <span className="flex-1 text-center text-white">{fontSize}px</span>
                                        <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-white"><ZoomIn size={16} /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Font Family</label>
                                    <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full bg-slate-800 text-white rounded p-2">
                                        <option value="serif">Serif</option>
                                        <option value="sans-serif">Sans Serif</option>
                                        <option value="monospace">Monospace</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Line Height</label>
                                    <input type="range" min="1.2" max="2.5" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="w-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'md:ml-80' : ''}`}>

                {/* Header */}
                <div className={`sticky top-0 z-10 border-b flex items-center justify-between px-4 py-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(true)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                            <Menu size={20} />
                        </button>
                        <button onClick={() => router.push('/books/' + bookId)} className={`flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded-lg transition-all ${isBookmarked ? 'text-yellow-500' : darkMode ? 'text-slate-400 hover:text-yellow-500' : 'text-slate-600 hover:text-yellow-600'}`}
                            title="Bookmark"
                        >
                            <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                        </button>

                        <button
                            onClick={speak}
                            className={`p-2 rounded-lg transition-colors ${isReading ? 'bg-indigo-600 text-white' : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}
                            title="Read Aloud"
                        >
                            {isReading ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className={`w-full h-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
                </div>

                {/* Reader Content */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="max-w-4xl mx-auto px-6 py-12 min-h-full flex flex-col">

                        <div className="text-center mb-8">
                            <h1 className={`text-3xl font-display font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{book?.title}</h1>
                            <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Page {currentPage} of {totalPages}</p>
                        </div>

                        {book?.pdf_url ? (
                            <div className="flex-1 relative min-h-[60vh] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                <iframe
                                    src={`${book.pdf_url}#page=${currentPage}&view=FitH&scrollbar=0&toolbar=0&navpanes=0`}
                                    className="w-full h-full absolute inset-0 bg-white"
                                    title={book.title}
                                />
                                {/* Overlay to block PDF internal navigation if needed, but iframe limits control. 
                                    Ideally we'd use react-pdf for true control, but iframe is the lightweight MVP choice. */}
                            </div>
                        ) : (
                            <div
                                className={`prose prose-lg max-w-none mx-auto ${darkMode ? 'prose-invert' : ''}`}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: lineHeight,
                                    fontFamily: fontFamily
                                }}
                            >
                                <p>{getPageContent()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className={`border-t p-4 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                }`}
                        >
                            <ChevronLeft size={20} />
                            Previous
                        </button>

                        <div className={`px-4 font-mono font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {currentPage} / {totalPages}
                        </div>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
