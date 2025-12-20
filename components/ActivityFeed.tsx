'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ActivityFeed() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const fetchActivity = async () => {
            // 1. Fetch recent reviews
            const { data: reviews } = await supabase
                .from('reviews')
                .select('*, profiles(username), books(title)')
                .order('created_at', { ascending: false })
                .limit(3);

            // 2. Fetch recent list additions (mocked as user_books inserts for now or if you have a lists table)
            // Using user_books status updates as "Started Reading"
            const { data: reading } = await supabase
                .from('user_books')
                .select('*, profiles(username), books(title)')
                .eq('status', 'reading')
                .order('updated_at', { ascending: false })
                .limit(3);

            // 3. Fetch recent group joins
            const { data: joins } = await supabase
                .from('group_members')
                .select('*, profiles(username), study_groups(name)')
                .order('joined_at', { ascending: false })
                .limit(3);

            // Transform and merge
            const newActivities: any[] = [];

            reviews?.forEach((r: any) => newActivities.push({
                id: `rev-${r.id}`,
                type: 'review',
                user: r.profiles?.username || 'Anonymous',
                book: r.books?.title || 'Unknown Book',
                rating: r.rating,
                time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

            reading?.forEach((r: any) => newActivities.push({
                id: `read-${r.id}`,
                type: 'started',
                user: r.profiles?.username || 'Anonymous',
                book: r.books?.title || 'Unknown Book',
                time: new Date(r.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

            joins?.forEach((j: any) => newActivities.push({
                id: `join-${j.id}`,
                type: 'joined',
                user: j.profiles?.username || 'Anonymous',
                group: j.study_groups?.name || 'Unknown Group',
                time: new Date(j.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

            // Sort by time (approximated by internal push order effectively by 'latest' from fetches, random shuffle for variety ok)
            // Ideally verify against created_at if unified. For now, just interleave.
            setActivities(newActivities.sort(() => 0.5 - Math.random()));
        };

        fetchActivity();

        // Auto-refresh every 30s to keep "Live"
        const poll = setInterval(fetchActivity, 30000);
        return () => clearInterval(poll);
    }, []);


    useEffect(() => {
        if (activities.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activities.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [activities.length]);

    const getActivityText = (activity: any) => {
        switch (activity.type) {
            case 'review':
                return (
                    <>
                        <span className="font-semibold text-white">{activity.user}</span>
                        <span className="text-slate-400"> reviewed </span>
                        <span className="font-semibold text-indigo-400">"{activity.book}"</span>
                        {activity.rating && (
                            <span className="ml-2 text-yellow-400">
                                {'⭐'.repeat(activity.rating)}
                            </span>
                        )}
                    </>
                );
            case 'started':
                return (
                    <>
                        <span className="font-semibold text-white">{activity.user}</span>
                        <span className="text-slate-400"> started reading </span>
                        <span className="font-semibold text-indigo-400">"{activity.book}"</span>
                    </>
                );
            case 'joined':
                return (
                    <>
                        <span className="font-semibold text-white">{activity.user}</span>
                        <span className="text-slate-400"> joined </span>
                        <span className="font-semibold text-purple-400">{activity.group}</span>
                    </>
                );
            default:
                return null;
        }
    };

    if (activities.length === 0) return null; // Hide if no data

    return (
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="text-lg font-semibold text-white">Live Activity</h3>
            </div>

            <div className="space-y-3 min-h-[100px]">
                {activities.map((activity, index) => (
                    <div
                        key={activity.id} // Ensure unique ID
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-500 ${index === currentIndex
                            ? 'bg-indigo-600/10 border border-indigo-500/30 scale-105'
                            : 'bg-white/5 opacity-50'
                            }`}
                        style={{ display: index === currentIndex || index === (currentIndex + 1) % activities.length ? 'flex' : 'none' }} // Only show active + next for cleaner transition
                    >
                        <div className="flex-1 text-sm">
                            <p className="leading-relaxed">{getActivityText(activity)}</p>
                            <span className="text-xs text-slate-500 mt-1 block">{activity.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
