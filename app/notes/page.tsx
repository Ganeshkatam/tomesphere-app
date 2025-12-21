'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, FileText, Tag, Download, Target } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';
import StudentNav from '@/components/StudentNav';


interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export default function NotesPage() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error: any) {
            toast.error('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <StudentNav />
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                    <FileText size={32} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-1">Smart Notes</h1>
                                    <p className="text-slate-400">Your personal study companion</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/analytics')}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
                                >
                                    <Target size={20} />
                                    Analytics
                                </button>
                                <button
                                    onClick={() => router.push('/notes/create')}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    New Note
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6 flex gap-2 relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search notes by title, content, or tags..."
                            className="flex-1 px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <VoiceInput onTranscript={setSearchTerm} />
                        </div>
                    </div>

                    {/* Notes Grid */}
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                            <p className="text-slate-400 mt-4">Loading notes...</p>
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-20 glass-strong rounded-2xl">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-2xl font-bold text-white mb-2">No notes yet</h3>
                            <p className="text-slate-400 mb-6">
                                {searchTerm ? 'No notes match your search' : 'Create your first note to get started'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => router.push('/notes/create')}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all"
                                >
                                    Create Note
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNotes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => router.push(`/notes/${note.id}`)}
                                    className="glass-strong rounded-2xl p-6 hover:border-purple-500/30 transition-all cursor-pointer border border-white/10"
                                >
                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                                        {note.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                                        {note.content?.replace(/<[^>]*>/g, '') || 'No content'}
                                    </p>

                                    {/* Tags */}
                                    {note.tags && note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {note.tags.slice(0, 3).map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-lg"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                            {note.tags.length > 3 && (
                                                <span className="px-2 py-1 text-slate-500 text-xs">
                                                    +{note.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="text-xs text-slate-500">
                                        Updated {new Date(note.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Banner */}
                    <div className="mt-12 glass-strong rounded-2xl p-6 border-l-4 border-purple-500">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">💡</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Features</h3>
                                <ul className="text-slate-400 text-sm space-y-1">
                                    <li>✓ Cloud-synced across devices</li>
                                    <li>✓ Rich text editing with formatting</li>
                                    <li>✓ Organize with tags</li>
                                    <li>✓ Export as PDF or Word</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
