'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, User } from 'lucide-react';
// import toast, { Toaster } from 'react-hot-toast';

export default function MessagesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [followedUsers, setFollowedUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch users I follow to start conversations with
            // In a real app, this would also include people who messaged me even if I don't follow them
            const { data: follows, error } = await supabase
                .from('user_follows')
                .select('following_id, profiles!user_follows_following_id_fkey(*)')
                .eq('follower_id', user.id);

            if (error) throw error;

            const contacts = follows?.map((f: any) => f.profiles) || [];
            setFollowedUsers(contacts);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            // toast.error('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page">
            {/* <Toaster position="top-right" /> */}
            <Navbar role="user" currentPage="/messages" />

            <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-80px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">

                    {/* Sidebar / Contact List */}
                    <div className="glass-strong rounded-2xl p-4 flex flex-col h-full">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="text-pink-500" />
                            Messages
                        </h2>

                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500/50"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-4 text-slate-400">Loading contacts...</div>
                            ) : followedUsers.length > 0 ? (
                                followedUsers.map(profile => (
                                    <div
                                        key={profile.id}
                                        onClick={() => router.push(`/messages/${profile.id}`)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-pink-600/20 flex items-center justify-center text-pink-400 font-bold text-lg overflow-hidden border border-white/10">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-medium group-hover:text-pink-400 transition-colors truncate">
                                                {profile.name}
                                            </h3>
                                            <p className="text-slate-400 text-xs truncate">
                                                Tap to chat
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <p>You haven't followed anyone yet.</p>
                                    <button
                                        onClick={() => router.push('/community')}
                                        className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm text-white"
                                    >
                                        Find Friends
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Empty State for Desktop */}
                    <div className="hidden md:flex col-span-2 glass-strong rounded-2xl items-center justify-center text-center p-8">
                        <div className="max-w-md">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageSquare size={40} className="text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Select a Conversation</h3>
                            <p className="text-slate-400">
                                Choose a friend from the list to start chatting or finding new study partners.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
