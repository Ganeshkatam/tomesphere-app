'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Book } from '@/lib/supabase';
import BookCard from '@/components/BookCard';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';

const ACADEMIC_SUBJECTS = [
    'All Subjects',
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business',
    'Economics',
    'Psychology',
    'History',
    'Literature',
    'Philosophy',
    'Medicine',
    'Law',
    'Education'
];

export default function AcademicLibraryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'All Subjects');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        author: '',
        subject: 'Computer Science',
        file: null as File | null
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
        fetchBooks();
    }, [selectedSubject]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to upload');
            router.push('/login');
            return;
        }
        if (!uploadForm.file) return;

        setUploading(true);
        try {
            const fileName = `${Date.now()}-${uploadForm.file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(fileName, uploadForm.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('books')
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase.from('books').insert({
                title: uploadForm.title,
                author: uploadForm.author,
                academic_subject: uploadForm.subject,
                pdf_url: publicUrl,
                is_textbook: true,
                genre: 'Academic', // Default
                description: `Academic resource for ${uploadForm.subject}`,
                pages: 0, // Placeholder
                cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=300&h=450', // Generic cover
            });

            if (dbError) throw dbError;

            toast.success('Resource uploaded successfully!');
            setShowUploadModal(false);
            setUploadForm({ title: '', author: '', subject: 'Computer Science', file: null });
            fetchBooks();
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const fetchBooks = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('books')
                .select('*')
                .eq('is_textbook', true)
                .order('title');

            if (selectedSubject !== 'All Subjects') {
                query = query.eq('academic_subject', selectedSubject);
            }

            const { data, error } = await query;
            if (error) throw error;
            setBooks(data || []);
        } catch (error: any) {
            toast.error('Failed to load academic books');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (bookId: string) => {
        if (!user) {
            toast.error('Please sign in to like books');
            router.push('/login');
            return;
        }

        // Like logic here
        toast.success('Book liked!');
    };

    const handleRate = async (bookId: string, rating: number) => {
        if (!user) {
            toast.error('Please sign in to rate books');
            router.push('/login');
            return;
        }

        // Rating logic here
        toast.success(`Rated ${rating} stars!`);
    };

    const handleAddToList = async (bookId: string, status: string) => {
        if (!user) {
            toast.error('Please sign in to add to reading list');
            router.push('/login');
            return;
        }

        // Add to list logic
        toast.success(`Added to ${status}!`);
    };

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/home')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                            <GraduationCap size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-1">Academic Library</h1>
                            <p className="text-slate-400">Textbooks and reference materials for students</p>
                        </div>
                    </div>
                </div>

                {/* Subject Filter */}
                <div className="mb-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="glass-strong rounded-2xl p-6 flex-1">
                            <h3 className="text-lg font-semibold text-white mb-4">Filter by Subject</h3>
                            <div className="flex flex-wrap gap-2">
                                {ACADEMIC_SUBJECTS.map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSubject === subject
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="h-fit px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-600/20 whitespace-nowrap"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload Resource
                        </button>
                    </div>
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="glass-strong rounded-2xl p-8 max-w-md w-full relative">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6">Upload Academic Resource</h2>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={uploadForm.title}
                                        onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Author</label>
                                    <input
                                        type="text"
                                        required
                                        value={uploadForm.author}
                                        onChange={e => setUploadForm({ ...uploadForm, author: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Subject</label>
                                    <select
                                        value={uploadForm.subject}
                                        onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                                    >
                                        {ACADEMIC_SUBJECTS.filter(s => s !== 'All Subjects').map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">PDF File</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        required
                                        onChange={e => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                                        className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all disabled:opacity-50 mt-4 flex justify-center"
                                >
                                    {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Upload Resource'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Books Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {selectedSubject === 'All Subjects' ? 'All Textbooks' : selectedSubject}
                        </h2>
                        <p className="text-slate-400">{books.length} books found</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                            <p className="text-slate-400 mt-4">Loading textbooks...</p>
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-20 glass-strong rounded-2xl">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-2xl font-bold text-white mb-2">No textbooks found</h3>
                            <p className="text-slate-400">Try selecting a different subject</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                            {books.map(book => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    onLike={() => handleLike(book.id)}
                                    onRate={(rating) => handleRate(book.id, rating)}
                                    onAddToList={(status) => handleAddToList(book.id, status)}
                                    isLiked={false}
                                    userRating={0}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Banner */}
                <div className="mt-12 glass-strong rounded-2xl p-6 border-l-4 border-green-500">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">💡</div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Quick Reference Guides</h3>
                            <p className="text-slate-400 text-sm mb-3">
                                Each textbook includes subject-wise categorization, latest editions, and quick reference materials.
                                Use the citation generator to create proper references for your research papers.
                            </p>
                            <button
                                onClick={() => router.push('/citations')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all"
                            >
                                Go to Citation Generator →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
