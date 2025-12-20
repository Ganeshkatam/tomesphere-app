'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(
    () => import('react-quill'),
    {
        ssr: false,
        loading: () => <div className="h-96 bg-white rounded-xl flex items-center justify-center">Loading editor...</div>
    }
) as any;

interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    user_id: string;
}

export default function NoteEditorPage() {
    const params = useParams();
    const router = useRouter();
    const noteId = params.id as string;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isNewNote, setIsNewNote] = useState(true);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        checkAuth();
        if (noteId && noteId !== 'create') {
            setIsNewNote(false);
            fetchNote();
        } else {
            setLoading(false);
        }
    }, [noteId]);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUserId(user.id);
    };

    const fetchNote = async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('id', noteId)
                .single();

            if (error) throw error;

            setTitle(data.title);
            setContent(data.content);
            setTags(data.tags || []);
        } catch (error: any) {
            toast.error('Failed to load note');
            router.push('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            if (isNewNote) {
                // Create new note
                const { error } = await supabase.from('notes').insert({
                    user_id: userId,
                    title: title.trim(),
                    content: content,
                    tags: tags
                });

                if (error) throw error;
                toast.success('Note created!');
            } else {
                // Update existing note
                const { error } = await supabase
                    .from('notes')
                    .update({
                        title: title.trim(),
                        content: content,
                        tags: tags,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', noteId);

                if (error) throw error;
                toast.success('Note updated!');
            }

            router.push('/notes');
        } catch (error: any) {
            toast.error('Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId);

            if (error) throw error;

            toast.success('Note deleted');
            router.push('/notes');
        } catch (error: any) {
            toast.error('Failed to delete note');
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'code-block'],
            ['clean']
        ]
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.push('/notes')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Notes
                    </button>

                    <div className="flex gap-3">
                        {!isNewNote && (
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="glass-strong rounded-2xl p-8">
                    <h1 className="text-3xl font-bold text-white mb-6">
                        {isNewNote ? 'Create Note' : 'Edit Note'}
                    </h1>

                    {/* Title Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter note title..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 text-lg font-semibold"
                        />
                    </div>

                    {/* Rich Text Editor */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-2">
                            Content
                        </label>
                        <div className="bg-white rounded-xl overflow-hidden">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={modules}
                                style={{ height: '384px' }}
                                placeholder="Start writing your notes..."
                            />
                        </div>
                        <style jsx global>{`
                            @import url('https://cdn.quilljs.com/1.3.6/quill.snow.css');
                        `}</style>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder="Add a tag..."
                                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                            />
                            <button
                                onClick={handleAddTag}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-sm flex items-center gap-2"
                                >
                                    #{tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-purple-100 transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
