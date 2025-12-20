'use client';

import { Trophy, Calendar, Users, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Contest {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'upcoming' | 'past';
    participants_count: number;
    prize_xp: number;
    image_url?: string;
}

export default function ContestCard({ contest }: { contest: Contest }) {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'past': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Live Now';
            case 'upcoming': return 'Coming Soon';
            case 'past': return 'Ended';
            default: return status;
        }
    };

    return (
        <div
            className="group glass-strong rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/10 hover:border-pink-500/50"
            onClick={() => router.push(`/contests/${contest.id}`)}
        >
            <div className="relative h-48 overflow-hidden">
                <img
                    src={contest.image_url || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=60'}
                    alt={contest.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusColor(contest.status)}`}>
                    {getStatusLabel(contest.status)}
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
                    {contest.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {contest.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Trophy size={16} className="text-yellow-500" />
                        <span>{contest.prize_xp} XP Prize</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Users size={16} className="text-blue-400" />
                        <span>{contest.participants_count} Joined</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-slate-300 text-sm">
                        <Calendar size={16} className="text-pink-400" />
                        <span>
                            {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    {contest.status === 'active' && (
                        <div className="flex items-center gap-2 text-green-400 text-xs font-mono animate-pulse">
                            <Clock size={14} />
                            <span>Ending in 2 days</span>
                        </div>
                    )}
                    <button className="ml-auto w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-pink-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium">
                        View Details
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
