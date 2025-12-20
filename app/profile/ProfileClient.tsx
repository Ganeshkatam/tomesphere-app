'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser, Profile } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import VoiceInput from '@/components/VoiceInput';
import MFASetup from '@/components/MFASetup';
import toast, { Toaster } from 'react-hot-toast';
import {
    BookOpen, Star, TrendingUp, Zap, Trophy, Flame, Crown, Sparkles, Save, X, Globe,
    Linkedin, Twitter, Github, Lock, Bell, Eye, Target, BarChart3, Camera, Upload, Clock,
    Users, UserPlus, UserMinus, User, Mail, Phone, Calendar, Edit2, MessageSquare
} from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'activity' | 'security' | 'network'>('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Social State
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [networkLoading, setNetworkLoading] = useState(false);

    // Editable fields
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar_url: '',
        phone_number: '',
        date_of_birth: '',
        location: '',
        website: '',
        twitter: '',
        linkedin: '',
        github: '',
        reading_goal: 50,
        notification_preferences: {
            email: true,
            push: true,
            weekly_digest: true
        }
    });

    // Track original values for verification
    const [originalEmail, setOriginalEmail] = useState('');
    const [originalPhone, setOriginalPhone] = useState('');

    const [stats, setStats] = useState({
        booksRead: 0,
        pagesRead: 0,
        readingStreak: 0,
        totalHours: 0,
        achievements: 0,
        level: 1
    });

    const router = useRouter();

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            // Load Social Stats
            if (currentUser) {
                const { count: followers } = await supabase
                    .from('user_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', currentUser.id);

                const { count: following } = await supabase
                    .from('user_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', currentUser.id);

                setFollowersCount(followers || 0);
                setFollowingCount(following || 0);
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setOriginalEmail(user?.email || '');
                setOriginalPhone(profileData.phone_number || '');
                setFormData({
                    name: profileData.name || '',
                    bio: profileData.bio || '',
                    avatar_url: profileData.avatar_url || '',
                    phone_number: profileData.phone_number || '',
                    date_of_birth: profileData.date_of_birth || '',
                    location: profileData.location || '',
                    website: profileData.website || '',
                    twitter: profileData.twitter || '',
                    linkedin: profileData.linkedin || '',
                    github: profileData.github || '',
                    reading_goal: profileData.reading_goal || 50,
                    notification_preferences: profileData.notification_preferences || {
                        email: true,
                        push: true,
                        weekly_digest: true
                    }
                });

                setStats({
                    booksRead: 47,
                    pagesRead: 12580,
                    readingStreak: 15,
                    totalHours: 156,
                    achievements: 12,
                    level: 8
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData: any = {
                name: formData.name,
                bio: formData.bio,
                avatar_url: formData.avatar_url,
                date_of_birth: formData.date_of_birth,
                location: formData.location,
                website: formData.website,
                twitter: formData.twitter,
                linkedin: formData.linkedin,
                github: formData.github,
                reading_goal: formData.reading_goal,
                notification_preferences: formData.notification_preferences
            };

            // Only update phone_number if it was originally empty (one-time update)
            if (!originalPhone && formData.phone_number) {
                updateData.phone_number = formData.phone_number;
                toast.success('Phone number saved! Future changes require verification.');
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Profile updated successfully!');
            setActiveTab('overview');
            await initializePage();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const loadNetworkData = async () => {
        if (!user) return;
        setNetworkLoading(true);
        try {
            // Fetch Followers
            const { data: followersData } = await supabase
                .from('user_follows')
                .select('follower_id, profiles!user_follows_follower_id_fkey(*)')
                .eq('following_id', user.id);

            // Fetch Following
            const { data: followingData } = await supabase
                .from('user_follows')
                .select('following_id, profiles!user_follows_following_id_fkey(*)')
                .eq('follower_id', user.id);

            // Flatten data
            const myFollowers = followersData?.map((f: any) => f.profiles) || [];
            const myFollowing = followingData?.map((f: any) => f.profiles) || [];

            setFollowers(myFollowers);
            setFollowing(myFollowing);

            // Fetch Suggestions (Simple: Users not followed and not self)
            const followingIds = myFollowing.map(p => p.id);
            const { data: suggestions } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id)
                .not('id', 'in', `(${followingIds.length > 0 ? followingIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
                .limit(5);

            setSuggestedUsers(suggestions || []);

        } catch (error) {
            console.error('Error loading network:', error);
            toast.error('Failed to load network');
        } finally {
            setNetworkLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'network') {
            loadNetworkData();
        }
    }, [activeTab]);

    const handleFollow = async (targetId: string) => {
        try {
            await supabase.from('user_follows').insert({
                follower_id: user.id,
                following_id: targetId
            });
            toast.success('Followed user!');
            loadNetworkData(); // Refresh list
            setFollowingCount(prev => prev + 1);
        } catch (error) {
            toast.error('Failed to follow');
        }
    };

    const handleUnfollow = async (targetId: string) => {
        try {
            await supabase.from('user_follows').delete()
                .eq('follower_id', user.id)
                .eq('following_id', targetId);
            toast.success('Unfollowed user');
            loadNetworkData(); // Refresh list
            setFollowingCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error('Failed to unfollow');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
                <Navbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
            <Navbar />
            <Toaster position="top-center" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                    <div className="relative glass-strong p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                        {formData.avatar_url ? (
                                            <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={64} className="text-white" />
                                        )}
                                    </div>
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 transition-colors">
                                    <Camera size={18} className="text-white" />
                                </button>
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                    <Crown size={14} />
                                    Lv {stats.level}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2">{formData.name}</h1>
                                <p className="text-slate-300 mb-3">{formData.bio || 'No bio yet'}</p>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <span className="flex items-center gap-2 text-slate-400">
                                        <Mail size={16} />
                                        {user?.email}
                                    </span>
                                    {formData.phone_number && (
                                        <span className="flex items-center gap-2 text-slate-400">
                                            <Phone size={16} />
                                            {formData.phone_number}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-2 text-slate-400">
                                        <Calendar size={16} />
                                        Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Edit2 size={18} />
                                {activeTab === 'edit' ? 'Cancel' : 'Edit Profile'}
                            </button>
                            <button
                                onClick={() => setActiveTab(activeTab === 'security' ? 'overview' : 'security')}
                                className="px-6 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all ml-2 flex items-center gap-2"
                            >
                                <Lock size={18} />
                                Security
                            </button>
                            <button
                                onClick={() => setActiveTab(activeTab === 'network' ? 'overview' : 'network')}
                                className={`px-6 py-2 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all ml-2 flex items-center gap-2 ${activeTab === 'network' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5'}`}
                            >
                                <Users size={18} />
                                Network
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-white/10">
                            <StatBox icon={BookOpen} label="Books Read" value={stats.booksRead} color="from-blue-600 to-cyan-600" />
                            <StatBox icon={Sparkles} label="Pages" value={stats.pagesRead.toLocaleString()} color="from-purple-600 to-pink-600" />
                            <StatBox icon={Flame} label="Day Streak" value={stats.readingStreak} color="from-orange-600 to-red-600" />
                            <StatBox icon={Clock} label="Total Hours" value={stats.totalHours} color="from-green-600 to-emerald-600" />
                            <StatBox icon={Trophy} label="Achievements" value={stats.achievements} color="from-yellow-600 to-orange-600" />
                            <StatBox icon={TrendingUp} label="Level" value={stats.level} color="from-indigo-600 to-purple-600" />
                        </div>
                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
                                <MFASetup />
                            </div>
                        )}

                    </div>
                </div>

                {/* Edit Form */}
                {activeTab === 'edit' && (
                    <div className="glass-strong rounded-2xl p-8 border border-white/10 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                                    <div className="relative">
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-indigo-500"
                                            placeholder="Tell us about yourself..."
                                        />
                                        <div className="absolute right-2 bottom-2">
                                            <VoiceInput onTranscript={(text) => setFormData({ ...formData, bio: formData.bio + ' ' + text })} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email (Read-only)</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed"
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Phone Number {originalPhone && '(Read-only)'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        disabled={!!originalPhone}
                                        className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 ${originalPhone ? 'text-slate-500 cursor-not-allowed' : 'text-white'}`}
                                        placeholder={originalPhone ? '' : '+918317527188'}
                                    />
                                    {originalPhone && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            🔒 To change your phone number, please contact support
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="City, Country"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Social & Preferences */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Social Links & Settings</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Avatar URL</label>
                                    <input
                                        type="url"
                                        value={formData.avatar_url}
                                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <Globe size={16} />
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://yourwebsite.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <Twitter size={16} />
                                        Twitter
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.twitter}
                                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                        placeholder="@username"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <Linkedin size={16} />
                                        LinkedIn
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.linkedin}
                                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        placeholder="linkedin.com/in/username"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <Github size={16} />
                                        GitHub
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.github}
                                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                        placeholder="github.com/username"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <Target size={16} />
                                        Annual Reading Goal
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.reading_goal}
                                        onChange={(e) => setFormData({ ...formData, reading_goal: parseInt(e.target.value) })}
                                        min="1"
                                        max="1000"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Notification Preferences</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.notification_preferences.email}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    notification_preferences: {
                                                        ...formData.notification_preferences,
                                                        email: e.target.checked
                                                    }
                                                })}
                                                className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-indigo-600 checked:border-indigo-600"
                                            />
                                            <span className="text-slate-300">Email Notifications</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.notification_preferences.push}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    notification_preferences: {
                                                        ...formData.notification_preferences,
                                                        push: e.target.checked
                                                    }
                                                })}
                                                className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-indigo-600 checked:border-indigo-600"
                                            />
                                            <span className="text-slate-300">Push Notifications</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.notification_preferences.weekly_digest}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    notification_preferences: {
                                                        ...formData.notification_preferences,
                                                        weekly_digest: e.target.checked
                                                    }
                                                })}
                                                className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-indigo-600 checked:border-indigo-600"
                                            />
                                            <span className="text-slate-300">Weekly Digest</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save size={20} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className="px-8 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <X size={20} />
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Overview Content (existing design) */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Reading Progress */}
                            <div className="glass-strong rounded-2xl p-6 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Target className="text-indigo-400" />
                                    Reading Progress
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-300">Annual Goal</span>
                                            <span className="text-white font-bold">{stats.booksRead} / {formData.reading_goal} books</span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" style={{ width: `${(stats.booksRead / formData.reading_goal) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recently Read */}
                            <div className="glass-strong rounded-2xl p-6 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4">Recently Read</h3>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className="w-12 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded" />
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium">Book Title {i}</h4>
                                                <p className="text-sm text-slate-400">Author Name</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="text-xs text-slate-400">5.0</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Profile Details */}
                            <div className="glass-strong rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">Profile Details</h3>
                                <div className="space-y-3 text-sm">
                                    {formData.location && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Location</span>
                                            <span className="text-white">{formData.location}</span>
                                        </div>
                                    )}
                                    {formData.date_of_birth && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Birthday</span>
                                            <span className="text-white">{new Date(formData.date_of_birth).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Member Since</span>
                                        <span className="text-white">{new Date(profile?.created_at || '').toLocaleDateString()}</span>
                                    </div>
                                    {formData.website && (
                                        <div className="pt-2 border-t border-white/10">
                                            <a href={formData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
                                                <Globe size={14} />
                                                Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="glass-strong rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">Badges</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {['🥇', '🥈', '🥉', '🏆', '⭐', '💎'].map((badge, i) => (
                                        <div key={i} className="aspect-square bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-600/50 rounded-xl flex items-center justify-center text-3xl">
                                            {badge}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Network Tab */}
                {activeTab === 'network' && (
                    <div className="glass-strong rounded-2xl p-8 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Your Network</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Following */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <UserPlus className="text-green-400" size={20} />
                                    Following ({following.length})
                                </h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {following.length > 0 ? (
                                        following.map((profile: any) => (
                                            <div key={profile.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer"
                                                    onClick={() => router.push(`/profile/${profile.id}`)}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                                        {profile.avatar_url ? (
                                                            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-full h-full p-2 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium hover:text-pink-400 transition-colors">{profile.name}</div>
                                                        <div className="text-xs text-slate-400">Lv 1 • Reader</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => router.push(`/messages/${profile.id}`)}
                                                        className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUnfollow(profile.id)}
                                                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                        title="Unfollow"
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 italic">Not following anyone yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Followers */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Users className="text-blue-400" size={20} />
                                    Followers ({followers.length})
                                </h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {followers.length > 0 ? (
                                        followers.map((profile: any) => (
                                            <div key={profile.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer"
                                                    onClick={() => router.push(`/profile/${profile.id}`)}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                                        {profile.avatar_url ? (
                                                            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-full h-full p-2 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-white font-medium hover:text-pink-400 transition-colors">{profile.name}</div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/messages/${profile.id}`)}
                                                    className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 italic">No followers yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Suggestions */}
                        {suggestedUsers.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-yellow-400" size={20} />
                                    Suggested for you
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {suggestedUsers.map((profile) => (
                                        <div key={profile.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all">
                                            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-full h-full p-3 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="text-white font-medium truncate cursor-pointer hover:text-pink-400"
                                                    onClick={() => router.push(`/profile/${profile.id}`)}
                                                >
                                                    {profile.name}
                                                </div>
                                                <button
                                                    onClick={() => handleFollow(profile.id)}
                                                    className="text-xs text-pink-400 hover:text-pink-300 font-bold mt-1"
                                                >
                                                    + Follow
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, color }: any) {
    return (
        <div className="text-center">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} p-2.5 mx-auto mb-2 shadow-lg`}>
                <Icon className="w-full h-full text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
        </div>
    );
}
