import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface CreateDiscussionModalProps {
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateDiscussionModal({ user, onClose, onSuccess }: CreateDiscussionModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error('Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('discussions')
                .insert({
                    title: title.trim(),
                    content: content.trim(),
                    user_id: user.id
                });

            if (error) throw error;

            toast.success('Discussion created!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating discussion:', error);
            toast.error(error.message || 'Failed to create discussion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl glass-strong rounded-2xl p-6 border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold gradient-text">New Discussion</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={6}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Creating...' : 'Create Discussion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
