'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Users, Lock } from 'lucide-react';

interface StudyGroup {
    id: string;
    name: string;
    description: string;
    subject: string;
    is_private: boolean;
    member_count?: number;
}

export default function StudyGroupsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const subjects = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Business', 'Literature'];

    useEffect(() => {
        fetchGroups();
    }, [selectedSubject]);

    const fetchGroups = async () => {
        try {
            let query = supabase
                .from('study_groups')
                .select('*, group_members(count)');

            if (selectedSubject !== 'All') {
                query = query.eq('subject', selectedSubject);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setGroups(data || []);
        } catch (error: any) {
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { error } = await supabase.from('group_members').insert({
                group_id: groupId,
                user_id: user.id,
                role: 'member'
            });

            if (error) throw error;

            toast.success('Joined group!');
            router.push(`/study-groups/${groupId}`);
        } catch (error: any) {
            toast.error('Failed to join group');
        }
    };

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                <Users size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-1">Study Groups</h1>
                                <p className="text-slate-400">Join collaborative learning communities</p>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/study-groups/create')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Create Group
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search groups..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                {/* Subject Filter */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {subjects.map(subject => (
                            <button
                                key={subject}
                                onClick={() => setSelectedSubject(subject)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSubject === subject
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Groups Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-20 glass-strong rounded-2xl">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No groups found</h3>
                        <p className="text-slate-400 mb-6">
                            {searchTerm ? 'Try a different search' : 'Be the first to create a study group!'}
                        </p>
                        <button
                            onClick={() => router.push('/study-groups/create')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                        >
                            Create Group
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGroups.map(group => (
                            <div
                                key={group.id}
                                className="glass-strong rounded-2xl p-6 hover:border-blue-500/30 transition-all border border-white/10"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded-lg">
                                        {group.subject}
                                    </span>
                                    {group.is_private && (
                                        <Lock size={16} className="text-slate-400" />
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                                    {group.name}
                                </h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                    {group.description || 'No description'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Users size={16} />
                                        <span>{group.member_count || 0} members</span>
                                    </div>
                                    <button
                                        onClick={() => handleJoinGroup(group.id)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
