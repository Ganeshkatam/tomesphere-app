'use client';

import { useState, useEffect, useRef, use } from 'react';
import Navbar from '@/components/Navbar';
import { supabase, DirectMessage, getUserProfile } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { MessageSquare, Send, ArrowLeft, User, MoreVertical } from 'lucide-react';
import { showError } from '@/lib/toast';

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
    const router = useRouter(); // Use the hook
    const { userId } = use(params);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [targetUser, setTargetUser] = useState<any>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUser(user);

            try {
                // Fetch target user profile
                const profile = await getUserProfile(userId);
                setTargetUser(profile);

                // Fetch existing messages
                const { data: msgs, error } = await supabase
                    .from('direct_messages')
                    .select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMessages(msgs || []);
            } catch (error) {
                console.error('Error loading chat:', error);
                showError('Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        if (userId) init();
    }, [userId, router]); // Added router to dependency

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Real-time Subscription
    useEffect(() => {
        if (!currentUser || !userId) return;

        const channel = supabase
            .channel('direct_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `receiver_id=eq.${currentUser.id}`, // Only listen for incoming
                },
                (payload) => {
                    if (payload.new.sender_id === userId) {
                        setMessages((prev) => [...prev, payload.new as DirectMessage]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, userId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const msgContent = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        // Optimistic update
        const tempId = Math.random().toString();
        const optimisticMsg: DirectMessage = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: userId,
            content: msgContent,
            is_read: false,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: userId,
                    content: msgContent
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        } catch (error) {
            console.error('Send error:', error);
            showError('Failed to send');
            // Remove optimistic message
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black/90 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page">
            {/* <Toaster position="top-right" /> */}
            <Navbar role="user" currentPage="/messages" />

            <div className="max-w-6xl mx-auto md:px-4 md:py-8 h-[calc(100vh-80px)] flex">
                <div className="w-full md:w-2/3 lg:w-1/2 mx-auto glass-strong md:rounded-2xl flex flex-col h-full overflow-hidden">

                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/messages')}
                                className="md:hidden text-slate-300 hover:text-white"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-pink-600/20 overflow-hidden border border-white/20">
                                    {targetUser?.avatar_url ? (
                                        <img src={targetUser.avatar_url} alt={targetUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-pink-400">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                            </div>
                            <div>
                                <h2 className="text-white font-bold">{targetUser?.name || 'User'}</h2>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-white">
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                        {messages.length > 0 ? (
                            messages.map((msg, index) => {
                                const isMe = msg.sender_id === currentUser.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isMe
                                                ? 'bg-pink-600 text-white rounded-br-none shadow-lg shadow-pink-600/10'
                                                : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/5'
                                                }`}
                                        >
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-pink-200' : 'text-slate-400'} text-right`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                                <MessageSquare size={48} className="mb-2" />
                                <p>No messages yet. Say hi! 👋</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500/50 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="w-12 h-12 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-600/20 active:scale-95"
                            >
                                <Send size={20} className={newMessage.trim() ? 'ml-0.5' : ''} />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
