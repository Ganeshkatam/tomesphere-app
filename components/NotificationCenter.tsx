'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification, requestNotificationPermission, onMessageListener } from '@/lib/notifications';
import { showSuccess } from '@/lib/toast';
import { timeAgo } from '@/lib/utils'; // Assuming this utility exists or I'll implement a simple one inline

export default function NotificationCenter({ user }: { user: any }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        loadNotifications();

        // Request permission on mount (optional, maybe better on user action)
        // requestNotificationPermission();

        // Listen for new foreground messages
        // onMessageListener()?.then((payload: any) => {
        //     toast(payload?.notification?.title);
        //     loadNotifications();
        // });

        // Realtime subscription for notifications table
        const channel = supabase
            .channel('notifications_change')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    const newNotif = payload.new;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    showSuccess('New notification');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const loadNotifications = async () => {
        const data = await getUserNotifications(user.id);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Simple time ago helper
    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border border-slate-900 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
                                >
                                    <Check size={12} /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group ${!notif.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-primary' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white mb-0.5 truncate">{notif.title}</p>
                                                <p className="text-sm text-slate-400 line-clamp-2 mb-1.5">{notif.message}</p>
                                                <p className="text-xs text-slate-500">{getTimeAgo(notif.created_at)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, notif.id)}
                                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell size={32} className="mx-auto mb-3 opacity-30" />
                                    <p>No notifications yet</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-white/10 text-center bg-white/5">
                                <button className="text-xs text-slate-400 hover:text-white transition-colors">
                                    View All History
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
