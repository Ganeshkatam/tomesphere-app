'use client';

import { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'maintenance';
}

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissed, setDismissed] = useState<string[]>([]);

    useEffect(() => {
        fetchAnnouncements();

        // Check for dismissed announcements in localStorage
        const stored = localStorage.getItem('dismissed_announcements');
        if (stored) {
            setDismissed(JSON.parse(stored));
        }
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await supabase
                .from('announcements')
                .select('*')
                .eq('is_active', true)
                .lte('starts_at', new Date().toISOString())
                .gte('ends_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (data) {
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const handleDismiss = (id: string) => {
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle size={20} />;
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertTriangle size={20} />;
            case 'maintenance':
                return <Megaphone size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getStyles = (type: string) => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300';
            case 'success':
                return 'bg-green-600/20 border-green-500/50 text-green-300';
            case 'error':
                return 'bg-red-600/20 border-red-500/50 text-red-300';
            case 'maintenance':
                return 'bg-orange-600/20 border-orange-500/50 text-orange-300';
            default:
                return 'bg-blue-600/20 border-blue-500/50 text-blue-300';
        }
    };

    const activeAnnouncements = announcements.filter(a => !dismissed.includes(a.id));

    if (activeAnnouncements.length === 0) return null;

    return (
        <div className="space-y-2">
            {activeAnnouncements.map((announcement) => (
                <div
                    key={announcement.id}
                    className={`${getStyles(announcement.type)} border rounded-lg p-4 flex items-start gap-4 animate-slideIn`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(announcement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{announcement.title}</h3>
                        <p className="text-sm opacity-90">{announcement.content}</p>
                    </div>
                    <button
                        onClick={() => handleDismiss(announcement.id)}
                        className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
}
