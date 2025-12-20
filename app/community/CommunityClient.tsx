'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { MessageSquare, Heart, Users, Plus, TrendingUp, Clock, BookOpen } from 'lucide-react';
import CreateDiscussionModal from '@/components/CreateDiscussionModal';
import CreateClubModal from '@/components/CreateClubModal';

interface Discussion {
    id: string;
    title: string;
    content: string;
    user_id: string;
    book_id?: string;
    created_at: string;
    profiles?: { name: string; avatar_url?: string };
    books?: { title: string; cover_url?: string };
    comment_count?: number;
    like_count?: number;
    is_liked?: boolean;
}

interface BookClub {
    id: string;
    name: string;
    description: string;
    creator_id: string;
    cover_image_url?: string;
    member_count?: number;
    is_member?: boolean;
    created_at: string;
}

export default function CommunityClient() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'discussions' | 'clubs' | 'trending'>('discussions');
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [bookClubs, setBookClubs] = useState<BookClub[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadData();

        // Real-time updates for discussions
        const channel = supabase
            .channel('community_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'discussions' },
                (payload) => {
                    const newDiscussion = payload.new as Discussion;
                    // Simple logic to add new discussion if dynamic fetching isn't complex
                    // Ideally we'd fetch the related profile/book data for it first
                    toast.success('New discussion posted!');
                    if (activeTab === 'discussions') {
                        // Reload list to get full joins
                        loadDiscussions(user);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab]);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            if (activeTab === 'discussions') {
                await loadDiscussions(currentUser);
            } else if (activeTab === 'clubs') {
                await loadBookClubs(currentUser);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const loadDiscussions = async (currentUser: any) => {
        const { data } = await supabase
            .from('discussions')
            .select(`
                *,
                profiles(name, avatar_url),
                books(title, cover_url)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            // Get comment counts and like counts for each discussion
            const discussionsWithStats = await Promise.all(
                data.map(async (discussion) => {
                    const [{ count: commentCount }, { count: likeCount }, { data: userLike }] = await Promise.all([
                        supabase.from('discussion_comments').select('*', { count: 'exact', head: true }).eq('discussion_id', discussion.id),
                        supabase.from('discussion_likes').select('*', { count: 'exact', head: true }).eq('discussion_id', discussion.id),
                        supabase.from('discussion_likes').select('id').eq('discussion_id', discussion.id).eq('user_id', currentUser.id).single()
                    ]);

                    return {
                        ...discussion,
                        comment_count: commentCount || 0,
                        like_count: likeCount || 0,
                        is_liked: !!userLike
                    };
                })
            );

            setDiscussions(discussionsWithStats);
        }
    };

    const loadBookClubs = async (currentUser: any) => {
        const { data } = await supabase
            .from('book_clubs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            // Get member counts
            const clubsWithStats = await Promise.all(
                data.map(async (club) => {
                    const [{ count: memberCount }, { data: membership }] = await Promise.all([
                        supabase.from('club_members').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
                        supabase.from('club_members').select('id').eq('club_id', club.id).eq('user_id', currentUser.id).single()
                    ]);

                    return {
                        ...club,
                        member_count: memberCount || 0,
                        is_member: !!membership
                    };
                })
            );

            setBookClubs(clubsWithStats);
        }
    };

    const handleLikeDiscussion = async (discussionId: string, isLiked: boolean) => {
        if (!user) return;

        try {
            if (isLiked) {
                await supabase
                    .from('discussion_likes')
                    .delete()
                    .eq('discussion_id', discussionId)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('discussion_likes')
                    .insert({ discussion_id: discussionId, user_id: user.id });
            }

            // Reload discussions
            await loadDiscussions(user);
        } catch (error) {
            toast.error('Failed to like discussion');
        }
    };

    const handleJoinClub = async (clubId: string, isMember: boolean) => {
        if (!user) return;

        try {
            if (isMember) {
                await supabase
                    .from('club_members')
                    .delete()
                    .eq('club_id', clubId)
                    .eq('user_id', user.id);
                toast.success('Left club');
            } else {
                await supabase
                    .from('club_members')
                    .insert({ club_id: clubId, user_id: user.id });
                toast.success('Joined club!');
            }

            // Reload clubs
            await loadBookClubs(user);
        } catch (error) {
            toast.error('Failed to join club');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold gradient-text">Community</h2>
                    <p className="text-slate-400">Connect with fellow readers</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    {activeTab === 'discussions' ? 'New Discussion' : 'Create Club'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                {[
                    { key: 'discussions', label: 'Discussions', icon: MessageSquare },
                    { key: 'clubs', label: 'Book Clubs', icon: Users },
                    { key: 'trending', label: 'Trending', icon: TrendingUp }
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                        className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all ${activeTab === key
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'discussions' && (
                    <div className="space-y-4">
                        {discussions.length > 0 ? (
                            discussions.map((discussion) => (
                                <div
                                    key={discussion.id}
                                    className="card hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => router.push(`/community/discussion/${discussion.id}`)}
                                >
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {discussion.profiles?.name?.[0] || 'U'}
                                        </div>

                                        <div className="flex-1">
                                            {/* Title */}
                                            <h3 className="text-lg font-bold mb-1">{discussion.title}</h3>

                                            {/* Meta */}
                                            <p className="text-sm text-slate-400 mb-2">
                                                {discussion.profiles?.name || 'Anonymous'} ·
                                                {discussion.books?.title && ` ${discussion.books.title} ·`}
                                                <Clock size={12} className="inline ml-1 mr-1" />
                                                {new Date(discussion.created_at).toLocaleDateString()}
                                            </p>

                                            {/* Content Preview */}
                                            <p className="text-slate-300 line-clamp-2 mb-3">{discussion.content}</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLikeDiscussion(discussion.id, discussion.is_liked || false);
                                                    }}
                                                    className={`flex items-center gap-1 hover:text-red-400 transition-colors ${discussion.is_liked ? 'text-red-400' : ''
                                                        }`}
                                                >
                                                    <Heart size={16} fill={discussion.is_liked ? 'currentColor' : 'none'} />
                                                    {discussion.like_count || 0}
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare size={16} />
                                                    {discussion.comment_count || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-slate-400">
                                <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
                                <h3 className="text-2xl font-bold mb-2">No discussions yet</h3>
                                <p className="mb-4">Start a conversation about your favorite books</p>
                                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                                    Create First Discussion
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'clubs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bookClubs.length > 0 ? (
                            bookClubs.map((club) => (
                                <div key={club.id} className="card hover:border-primary/30 transition-all">
                                    <div className="flex gap-4">
                                        {/* Club Icon */}
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <BookOpen size={32} className="text-white" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold mb-1">{club.name}</h3>
                                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">{club.description}</p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    <Users size={12} className="inline mr-1" />
                                                    {club.member_count || 0} members
                                                </span>
                                                <button
                                                    onClick={() => handleJoinClub(club.id, club.is_member || false)}
                                                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${club.is_member
                                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                        : 'bg-primary text-white hover:bg-primary-dark'
                                                        }`}
                                                >
                                                    {club.is_member ? 'Leave' : 'Join'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-20 text-slate-400">
                                <Users size={64} className="mx-auto mb-4 opacity-50" />
                                <h3 className="text-2xl font-bold mb-2">No book clubs yet</h3>
                                <p className="mb-4">Create the first book club and invite readers</p>
                                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                                    Create First Club
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'trending' && (
                    <div className="text-center py-20 text-slate-400">
                        <TrendingUp size={64} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold mb-2">Trending Coming Soon</h3>
                        <p>See what's hot in the community</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && activeTab === 'discussions' && (
                <CreateDiscussionModal
                    user={user}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => loadDiscussions(user)}
                />
            )}

            {showCreateModal && activeTab === 'clubs' && (
                <CreateClubModal
                    user={user}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => loadBookClubs(user)}
                />
            )}
        </div>
    );
}
