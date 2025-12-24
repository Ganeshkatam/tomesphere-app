'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';
import { ArrowLeft, Plus, Trash2, RotateCcw } from 'lucide-react';

interface Flashcard {
    id: string;
    front_text: string;
    back_text: string;
    subject: string;
}

export default function FlashcardsPage() {
    const router = useRouter();
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCard, setNewCard] = useState({ front: '', back: '', subject: '' });
    const [studyMode, setStudyMode] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        fetchFlashcards();
    }, []);

    const fetchFlashcards = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('flashcards')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFlashcards(data || []);
        } catch (error: any) {
            showError('Failed to load flashcards');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCard.front || !newCard.back) {
            showError('Please fill in both sides of the card');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('flashcards').insert({
                user_id: user.id,
                front_text: newCard.front,
                back_text: newCard.back,
                subject: newCard.subject || null
            });

            if (error) throw error;

            showSuccess('Flashcard created!');
            setNewCard({ front: '', back: '', subject: '' });
            setShowCreateModal(false);
            fetchFlashcards();
        } catch (error: any) {
            showError('Failed to create flashcard');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('flashcards').delete().eq('id', id);
            if (error) throw error;
            showSuccess('Flashcard deleted');
            fetchFlashcards();
        } catch (error: any) {
            showError('Failed to delete flashcard');
        }
    };

    if (studyMode && flashcards.length > 0) {
        const currentCard = flashcards[currentIndex];

        return (
            <div className="min-h-screen bg-gradient-page py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => {
                            setStudyMode(false);
                            setCurrentIndex(0);
                            setFlipped(false);
                        }}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft size={20} />
                        Exit Study Mode
                    </button>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Study Mode</h2>
                        <p className="text-slate-400">
                            Card {currentIndex + 1} of {flashcards.length}
                        </p>
                    </div>

                    <div
                        onClick={() => setFlipped(!flipped)}
                        className="glass-strong rounded-2xl p-12 min-h-[400px] flex items-center justify-center cursor-pointer hover:border-purple-500/30 transition-all border border-white/10"
                    >
                        <div className="text-center">
                            {currentCard.subject && (
                                <span className="px-3 py-1 bg-purple-600/20 text-purple-300 text-sm rounded-lg mb-4 inline-block">
                                    {currentCard.subject}
                                </span>
                            )}
                            <p className="text-2xl text-white font-medium">
                                {flipped ? currentCard.back_text : currentCard.front_text}
                            </p>
                            <p className="text-slate-500 text-sm mt-4">
                                Click to flip
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => {
                                setCurrentIndex(Math.max(0, currentIndex - 1));
                                setFlipped(false);
                            }}
                            disabled={currentIndex === 0}
                            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-30"
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={() => {
                                setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1));
                                setFlipped(false);
                            }}
                            disabled={currentIndex === flashcards.length - 1}
                            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-30"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.push('/exam-prep')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={20} />
                    Back to Exam Prep
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">Flashcards</h1>
                        <p className="text-slate-400">{flashcards.length} cards</p>
                    </div>
                    <div className="flex gap-3">
                        {flashcards.length > 0 && (
                            <button
                                onClick={() => setStudyMode(true)}
                                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={20} />
                                Study Mode
                            </button>
                        )}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            New Card
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                    </div>
                ) : flashcards.length === 0 ? (
                    <div className="text-center py-20 glass-strong rounded-2xl">
                        <div className="text-6xl mb-4">🗂️</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No flashcards yet</h3>
                        <p className="text-slate-400 mb-6">Create your first flashcard to start learning</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all"
                        >
                            Create Flashcard
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flashcards.map(card => (
                            <div key={card.id} className="glass-strong rounded-2xl p-6 border border-white/10">
                                {card.subject && (
                                    <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-lg mb-3 inline-block">
                                        {card.subject}
                                    </span>
                                )}
                                <div className="mb-4">
                                    <p className="text-xs text-slate-500 mb-1">Front:</p>
                                    <p className="text-white font-medium">{card.front_text}</p>
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs text-slate-500 mb-1">Back:</p>
                                    <p className="text-slate-300 text-sm">{card.back_text}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(card.id)}
                                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-lg glass-strong rounded-2xl p-6 border border-white/10">
                            <h3 className="text-2xl font-bold text-white mb-4">Create Flashcard</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Subject (Optional)</label>
                                    <input
                                        type="text"
                                        value={newCard.subject}
                                        onChange={(e) => setNewCard({ ...newCard, subject: e.target.value })}
                                        placeholder="e.g., Biology"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Front Side *</label>
                                    <textarea
                                        value={newCard.front}
                                        onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                                        placeholder="Question or term"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Back Side *</label>
                                    <textarea
                                        value={newCard.back}
                                        onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                                        placeholder="Answer or definition"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewCard({ front: '', back: '', subject: '' });
                                    }}
                                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
