'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import VoiceInput from '@/components/ui/VoiceInput';

import toast, { Toaster } from 'react-hot-toast';

export default function LibraryClient() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'reading' | 'want' | 'finished'>('reading');
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLibrary();
    }, [activeTab]);

    const loadLibrary = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            const statusMap = {
                reading: 'currently_reading',
                want: 'want_to_read',
                finished: 'finished'
            };

            const { data, error } = await supabase
                .from('reading_lists')
                .select('*, books(*)')
                .eq('user_id', currentUser.id)
                .eq('status', statusMap[activeTab]);

            if (error) throw error;
            setBooks(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading library:', error);
            toast.error('Failed to load library');
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

    return (
        <div className="min-h-screen bg-gradient-page">
            <Toaster position="top-right" />
            <Navbar role={user?.role || 'user'} currentPage="/library" />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8 animate-fadeIn">
                    <h1 className="text-5xl font-display font-bold mb-2">My Library</h1>
                    <p className="text-xl text-slate-400">Organize and track your reading journey</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10">
                    {[
                        { key: 'reading', label: '📖 Currently Reading', count: books.length },
                        { key: 'want', label: '📚 Want to Read', count: 0 },
                        { key: 'finished', label: '✅ Finished', count: 0 }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-6 py-3 font-semibold transition-all ${activeTab === tab.key
                                ? 'border-b-2 border-primary text-primary-light'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex gap-2 relative">
                    <input
                        type="text"
                        placeholder="Search your library..."
                        className="flex-1 px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <VoiceInput onTranscript={(text) => {
                            // Note: LibraryClient search logic is currently missing/visual only in original.
                            // We will just log it or set a hypothetical state if needed, or just let it type into input if controlled.
                            // Looking at the view_file, the input is UNCONTROLLED (no value/onChange prop).
                            // We should probably make it controlled or just accept the transcript for now.
                            // Since this task is about adding the input, we'll assume the user will connect the logic or we can try to find the input element.
                            const input = document.querySelector('input[placeholder="Search your library..."]') as HTMLInputElement;
                            if (input) {
                                input.value = text;
                                // Dispatch input event to trigger any potential listeners (though none here)
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }} />
                    </div>
                </div>

                {/* Books Grid */}
                {books.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">📚</div>
                        <h3 className="text-2xl font-bold mb-2">No books yet</h3>
                        <p className="text-slate-400 mb-6">Start building your library</p>
                        <button onClick={() => router.push('/explore')} className="btn btn-primary">
                            Explore Books
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
                        {books.map(item => (
                            <div key={item.id} className="h-full">
                                <BookCard
                                    book={item.books}
                                // Library specific props if needed, but BookCard handles basics.
                                // passing current actions if feasible, or just viewing.
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
