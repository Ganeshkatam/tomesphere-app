import { Book, Users, Trophy, Sparkles } from 'lucide-react';
import { Book as BookType } from '@/lib/supabase';

interface DashboardOverviewProps {
    stats: {
        totalBooks: number;
        totalUsers: number;
        topGenre: string;
        recentBooks: number;
    };
    recentBooksList: BookType[];
}

export default function DashboardOverview({ stats, recentBooksList }: DashboardOverviewProps) {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        Dashboard
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Overview of your platform's performance
                    </p>
                </div>
                <div className="text-sm text-slate-500 font-mono">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Books - Primary Gradient */}
                <div className="solid-card rounded-3xl p-8 relative overflow-hidden group bg-slate-800">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Book className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-xs">Total Library</div>
                        <div className="text-5xl font-bold text-white mb-4">{stats.totalBooks}</div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm">
                            <span>↗</span>
                            <span>+12% this week</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
                </div>

                {/* Total Users - Secondary Gradient */}
                <div className="solid-card rounded-3xl p-8 relative overflow-hidden group bg-slate-800">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24 text-pink-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-xs">Active Users</div>
                        <div className="text-5xl font-bold text-white mb-4">{stats.totalUsers}</div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-sm">
                            <span>↗</span>
                            <span>Growing fast</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500"></div>
                </div>

                {/* Top Genre - Accent Gradient */}
                <div className="solid-card rounded-3xl p-8 relative overflow-hidden group bg-slate-800">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-xs">Top Genre</div>
                        <div className="text-4xl font-bold text-white mb-4 truncate" title={stats.topGenre}>
                            {stats.topGenre}
                        </div>
                        <div className="text-sm text-slate-400">Most popular category</div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
                </div>

                {/* New Books - Success Gradient */}
                <div className="solid-card rounded-3xl p-8 relative overflow-hidden group bg-slate-800">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-xs">New Arrivals</div>
                        <div className="text-5xl font-bold text-white mb-4">{stats.recentBooks}</div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm">
                            <span>Last 30 days</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 solid-panel rounded-3xl p-8 bg-slate-900">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Recently Added</h3>
                        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentBooksList.slice(0, 5).map((book, index) => (
                            <div
                                key={book.id}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 group"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <img
                                    src={book.cover_url || 'https://via.placeholder.com/50'}
                                    alt={book.title}
                                    className="w-16 h-20 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-semibold truncate group-hover:text-indigo-400 transition-colors">{book.title}</h4>
                                    <p className="text-sm text-slate-400">{book.author}</p>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                                        {book.genre}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentBooksList.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                No recent activity to show.
                            </div>
                        )}
                    </div>
                </div>

                {/* System Status / Mini Widgets */}
                <div className="space-y-6">
                    <div className="solid-panel rounded-3xl p-8 bg-slate-900">
                        <h3 className="text-xl font-bold text-white mb-6">System Health</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Database Load</span>
                                    <span className="text-green-400">Healthy</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[24%] bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Storage</span>
                                    <span className="text-indigo-400">45% Used</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[45%] bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="solid-panel rounded-3xl p-8 bg-slate-900 border-indigo-500/20">
                        <h3 className="text-lg font-bold text-white mb-2">Pro Tip</h3>
                        <p className="text-sm text-indigo-200 mb-4">
                            Check the "Discover" tab to see what your users are seeing right now.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
