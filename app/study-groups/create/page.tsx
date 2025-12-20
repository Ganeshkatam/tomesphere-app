'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Users } from 'lucide-react';

export default function CreateGroupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        description: '',
        subject: 'Computer Science',
        maxMembers: 50,
        isPrivate: false,
        meetingLink: ''
    });
    const [loading, setLoading] = useState(false);

    const subjects = [
        'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
        'Biology', 'Engineering', 'Business', 'Literature', 'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name) {
            toast.error('Please enter a group name');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Create group
            const { data: group, error: groupError } = await supabase
                .from('study_groups')
                .insert({
                    name: form.name,
                    description: form.description,
                    subject: form.subject,
                    created_by: user.id,
                    max_members: form.maxMembers,
                    is_private: form.isPrivate,
                    meeting_link: form.meetingLink
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as owner
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            toast.success('Group created!');
            router.push(`/study-groups/${group.id}`);
        } catch (error: any) {
            toast.error('Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.push('/study-groups')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Groups
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                        <Users size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">Create Study Group</h1>
                        <p className="text-slate-400">Start a collaborative learning community</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8">
                    <div className="space-y-6">
                        {/* Group Name */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Group Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Advanced Algorithms Study Group"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe your group's purpose and what you'll study together..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Subject & Max Members */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Subject *
                                </label>
                                <select
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    {subjects.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Max Members
                                </label>
                                <input
                                    type="number"
                                    value={form.maxMembers}
                                    onChange={(e) => setForm({ ...form, maxMembers: parseInt(e.target.value) })}
                                    min="2"
                                    max="500"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Meeting Link */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Meeting Link (Optional)
                            </label>
                            <input
                                type="url"
                                value={form.meetingLink}
                                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                                placeholder="https://zoom.us/j/..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Privacy Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isPrivate"
                                checked={form.isPrivate}
                                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                                className="w-5 h-5 rounded bg-white/5 border-white/10"
                            />
                            <label htmlFor="isPrivate" className="text-sm text-white">
                                Make this group private (invite-only)
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/study-groups')}
                            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
