import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface CreateClubModalProps {
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateClubModal({ user, onClose, onSuccess }: CreateClubModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter a club name');
            return;
        }

        setLoading(true);
        try {
            // Create book club
            const { data: club, error: clubError } = await supabase
                .from('book_clubs')
                .insert({
                    name: name.trim(),
                    description: description.trim(),
                    creator_id: user.id,
                    is_private: isPrivate
                })
                .select()
                .single();

            if (clubError) throw clubError;

            // Auto-join creator as admin
            const { error: memberError } = await supabase
                .from('club_members')
                .insert({
                    club_id: club.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) throw memberError;

            toast.success('Book club created!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating club:', error);
            toast.error(error.message || 'Failed to create club');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl glass-strong rounded-2xl p-6 border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold gradient-text">Create Book Club</h2>
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
                            Club Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Sci-Fi Lovers Club"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell people what your club is about..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="private"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                        />
                        <label htmlFor="private" className="text-sm text-slate-300">
                            Make this club private (invite-only)
                        </label>
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
                            {loading ? 'Creating...' : 'Create Club'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
