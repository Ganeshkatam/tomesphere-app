'use client';

import { Bell, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function NotificationCenter() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    const sendNotification = async () => {
        if (!title || !body) return;

        await supabase.from('push_notifications').insert({
            title, body, sent_to: ['all'], sent_at: new Date().toISOString()
        });

        toast.success('Notification sent!');
        setTitle('');
        setBody('');
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
                <Bell size={20} /> Send Notification
            </h3>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
            />
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
            />
            <button onClick={sendNotification} className="btn-primary w-full">
                <Send size={18} /> Send to All Users
            </button>
        </div>
    );
}
