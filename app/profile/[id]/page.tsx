'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser, Profile } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { showError, showSuccess } from '@/lib/toast';
import {
    BookOpen, Star, TrendingUp, Zap, Trophy, Flame, Crown, Sparkles, MessageSquare, Globe,
    Linkedin, Twitter, Github, Mail, Calendar, UserPlus, UserMinus, User, ArrowLeft, Clock, Users
} from 'lucide-react';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const [stats, setStats] = useState({
        booksRead: 0,
        pagesRead: 0,
        readingStreak: 0,
        totalHours: 0,
        achievements: 0,
        level: 1
    });

    useEffect(() => {
        loadProfile();
    }, [id]);

    const loadProfile = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);

            // Fetch Profile
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                showError('User not found');
                router.push('/community');
                return;
            }
            setProfile(profileData);

            // Fetch Real Stats
            // 1. Books Read (from reading_lists where status = 'completed')
            const { count: booksReadCount } = await supabase
                .from('reading_lists')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', id)
                .eq('status', 'completed');

            // 2. Reading Streak (from profiles table if you have it, or calc from logs - defaulting to profile field or 0)
            // Assuming profile has 'streak' field, if not default 0
            const streak = profileData.streak || 0;

            // 3. Followers/Following
            const { count: followers } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', id);

            const { count: following } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', id);

            setFollowersCount(followers || 0);
            setFollowingCount(following || 0);

            // 4. Level calculation (example logic based on books read)
            const calculatedLevel = Math.floor(((booksReadCount || 0) / 5) + 1);

            setStats({
                booksRead: booksReadCount || 0,
                pagesRead: 0, // Pending 'reading_logs' implementation
                readingStreak: streak,
                totalHours: 0, // Pending 'reading_logs' implementation
                achievements: 0, // Pending 'achievements' table
                level: calculatedLevel
            });

            // Check following status
            if (user && user.id !== id) {
                const { data: followData } = await supabase
                    .from('user_follows')
                    .select('*')
                    .eq('follower_id', user.id)
                    .eq('following_id', id)
                    .single();
                setIsFollowing(!!followData);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading profile:', error);
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        try {
            await supabase.from('user_follows').insert({
                follower_id: currentUser.id,
                following_id: id
            });
            setIsFollowing(true);
            setFollowersCount(prev => prev + 1);
            showSuccess(`Followed ${profile?.name}`);
        } catch (error) {
            showError('Failed to follow user');
        }
    };

    const handleUnfollow = async () => {
        if (!currentUser) return;
        try {
            await supabase.from('user_follows').delete()
                .eq('follower_id', currentUser.id)
                .eq('following_id', id);
            setIsFollowing(false);
            setFollowersCount(prev => Math.max(0, prev - 1));
            showSuccess(`Unfollowed ${profile?.name}`);
        } catch (error) {
            showError('Failed to unfollow user');
        }
    };

    const handleMessage = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        router.push(`/messages/${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-page">
            {/* <Toaster position="top-right" /> */}
            <Navbar role="user" currentPage="/community" />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>

                {/* Header Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                    <div className="relative glass-strong p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                                    <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={64} className="text-slate-400" />
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg border border-white/10">
                                    <Crown size={14} />
                                    Lv {stats.level}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                                <p className="text-lg text-slate-300 mb-4 max-w-2xl">{profile.bio || 'No bio available.'}</p>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Users className="text-blue-400" size={18} />
                                        <span className="text-white font-bold">{followersCount}</span> Followers
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="text-green-400" size={18} />
                                        <span className="text-white font-bold">{followingCount}</span> Following
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="text-orange-400" size={18} />
                                        Joined {new Date(profile.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="flex gap-4">
                                    {profile.twitter && (
                                        <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-blue-400 transition-all">
                                            <Twitter size={20} />
                                        </a>
                                    )}
                                    {profile.github && (
                                        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-white transition-all">
                                            <Github size={20} />
                                        </a>
                                    )}
                                    {profile.website && (
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-pink-400 transition-all">
                                            <Globe size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {currentUser && currentUser.id !== id && (
                                <div className="flex flex-col gap-3 min-w-[160px]">
                                    {isFollowing ? (
                                        <button
                                            onClick={handleUnfollow}
                                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/5 flex items-center justify-center gap-2"
                                        >
                                            <UserMinus size={18} />
                                            Unfollow
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFollow}
                                            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2"
                                        >
                                            <UserPlus size={18} />
                                            Follow
                                        </button>
                                    )}
                                    <button
                                        onClick={handleMessage}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={18} />
                                        Message
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatBox icon={BookOpen} label="Books Read" value={stats.booksRead} color="from-blue-600 to-cyan-600" />
                    <StatBox icon={Sparkles} label="Pages Read" value={stats.pagesRead.toLocaleString()} color="from-purple-600 to-pink-600" />
                    <StatBox icon={Flame} label="Day Streak" value={stats.readingStreak} color="from-orange-600 to-red-600" />
                    <StatBox icon={Trophy} label="Achievements" value={stats.achievements} color="from-yellow-600 to-orange-600" />
                </div>

                {/* Recent Activity (Mock) */}
                <h3 className="text-xl font-bold text-white mb-4">Badges & Achievements</h3>
                <div className="glass-strong rounded-2xl p-6 border border-white/10">
                    <div className="flex flex-wrap gap-4">
                        {['🥇', '🥈', '🥉', '🏆', '⭐', '💎', '🚀', '📚'].map((badge, i) => (
                            <div key={i} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-help" title="Badge Title">
                                {badge}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, color }: any) {
    return (
        <div className="glass-strong p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} p-2.5 mb-3 shadow-lg group-hover:rotate-6 transition-transform`}>
                <Icon className="w-full h-full text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
        </div>
    );
}
