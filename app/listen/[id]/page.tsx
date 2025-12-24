'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BookOpen, Share2, Heart, Bookmark } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import Navbar from '@/components/Navbar';
import { showError, showSuccess } from '@/lib/toast';

export default async function ListenPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [audiobook, setAudiobook] = useState<any>(null);
    const [book, setBook] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAudiobook();
    }, [id]);

    const loadAudiobook = async () => {
        try {
            // First try to find audiobook entry
            const { data: audioData, error: audioError } = await supabase
                .from('audiobooks')
                .select('*')
                .eq('book_id', id)
                .single();

            // Fetch book details
            const { data: bookData } = await supabase
                .from('books')
                .select('*')
                .eq('id', id)
                .single();

            setBook(bookData);

            if (audioData) {
                setAudiobook(audioData);
            } else {
                showError('Audiobook not found');
            }
        } catch (error) {
            console.error('Error loading audiobook:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProgress = async (position: number) => {
        // Save progress to DB
        if (!audiobook) return;

        // Check for completion signal
        if (position === -1) {
            const { awardPoints } = await import('@/lib/gamification');
            const points = await awardPoints((await supabase.auth.getUser()).data.user?.id!, 'bookRead');
            showSuccess(`🎉 Audiobook Completed! +${points} XP`);
            return;
        }

        const { error } = await supabase
            .from('audio_progress')
            .upsert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                audiobook_id: audiobook.id,
                current_position_seconds: Math.floor(position),
                last_played_at: new Date().toISOString()
            }, { onConflict: 'user_id, audiobook_id' });
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-page flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
        </div>
    );

    if (!book) return <div className="min-h-screen flex items-center justify-center">Book not found</div>;

    return (
        <div className="min-h-screen bg-gradient-page">
            <Navbar role="user" currentPage="/listen" />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <div className="flex gap-4">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Share2 size={20} /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Heart size={20} /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Bookmark size={20} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Cover Art */}
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl skew-y-0 hover:skew-y-1 transition-transform duration-500 max-w-sm mx-auto w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2730"}
                            alt={book.title}
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Player Section */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2 gradient-text">
                                {book.title}
                            </h1>
                            <p className="text-xl text-slate-400 font-medium">
                                by {book.author}
                            </p>
                            <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                                <span className="bg-white/5 px-2 py-1 rounded">Audiobook</span>
                                <span>•</span>
                                <span>{book.genre}</span>
                            </div>
                        </div>

                        {/* Audio Player Component */}
                        <AudioPlayer
                            audioUrl={audiobook?.audio_url}
                            audiobookId={audiobook?.id}
                            onProgressUpdate={handleProgress}
                        />

                        {/* Description */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <BookOpen size={18} className="text-primary" />
                                Description
                            </h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                {book.description || "No description available."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
