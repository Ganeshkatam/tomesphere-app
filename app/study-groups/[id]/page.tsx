'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Users, Lock, MoreVertical, FileText, Video } from 'lucide-react';
import StudentNav from '@/components/StudentNav';

interface Message {
    id: string;
    group_id: string;
    user_id: string;
    message: string;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string;
    };
}

interface GroupDetails {
    id: string;
    name: string;
    description: string;
    subject: string;
    member_count: number;
    meeting_link?: string;
    is_private: boolean;
}

export default function GroupChatPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [group, setGroup] = useState<GroupDetails | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkAuth();
        fetchGroupDetails();
        fetchMessages();

        // Real-time subscription for new messages
        const channel = supabase
            .channel(`group_chat:${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`
            }, (payload) => {
                fetchNewMessage(payload.new.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);
    };

    const fetchGroupDetails = async () => {
        const { data, error } = await supabase
            .from('study_groups')
            .select('*, group_members(count)')
            .eq('id', groupId)
            .single();

        if (data) {
            setGroup({
                ...data,
                member_count: data.group_members[0].count
            });
        }
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('group_messages')
            .select('*, profiles(username, avatar_url)')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data);
            setLoading(false);
        }
    };

    const fetchNewMessage = async (messageId: string) => {
        const { data } = await supabase
            .from('group_messages')
            .select('*, profiles(username, avatar_url)')
            .eq('id', messageId)
            .single();

        if (data) {
            setMessages(prev => [...prev, data]);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            const { error } = await supabase.from('group_messages').insert({
                group_id: groupId,
                user_id: user.id,
                message: newMessage.trim()
            });

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading && !group) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/study-groups')} className="text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {group?.name}
                            {group?.is_private && <Lock size={16} className="text-slate-400" />}
                        </h1>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {group?.member_count} members online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {group?.meeting_link && (
                        <a
                            href={group.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                            title="Join Meeting"
                        >
                            <Video size={20} />
                        </a>
                    )}
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => {
                    const isMe = msg.user_id === user?.id;
                    const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {showAvatar ? (
                                <img
                                    src={msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles?.username || 'U'}`}
                                    alt={msg.profiles?.username}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10" />
                            )}
                            <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {showAvatar && !isMe && (
                                    <p className="text-xs text-slate-500 mb-1 ml-1">{msg.profiles?.username}</p>
                                )}
                                <div
                                    className={`px-4 py-2 rounded-2xl ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white/10 text-white rounded-bl-none'
                                        }`}
                                >
                                    <p>{msg.message}</p>
                                </div>
                                <p className={`text-[10px] text-slate-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-white/10">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-5xl mx-auto">
                    <button
                        type="button"
                        className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <FileText size={20} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
