'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, BookOpen, Activity, Eye } from 'lucide-react';

interface LiveMetric {
    label: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: any;
    color: string;
}

interface AnalyticsData {
    activeUsers: number;
    activeReadings: number;
    signupsToday: number;
    booksViewedToday: number;
    totalBooks: number;
    totalUsers: number;
    newBooksThisWeek: number;
}

export default function LiveMetrics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/admin/analytics?type=live');
            const result = await response.json();
            setData(result);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-strong rounded-2xl p-6 border border-white/10 animate-pulse">
                        <div className="h-20 bg-white/5 rounded-lg" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const metrics: LiveMetric[] = [
        {
            label: 'Active Users (24h)',
            value: data.activeUsers,
            icon: Activity,
            color: 'from-green-600 to-green-700',
            trend: 'up',
        },
        {
            label: 'Total Users',
            value: data.totalUsers,
            change: data.signupsToday,
            icon: Users,
            color: 'from-blue-600 to-blue-700',
            trend: data.signupsToday > 0 ? 'up' : 'neutral',
        },
        {
            label: 'Total Books',
            value: data.totalBooks,
            change: data.newBooksThisWeek,
            icon: BookOpen,
            color: 'from-purple-600 to-purple-700',
            trend: data.newBooksThisWeek > 0 ? 'up' : 'neutral',
        },
        {
            label: 'Active Readings',
            value: data.activeReadings,
            icon: Eye,
            color: 'from-indigo-600 to-indigo-700',
        },
    ];

    return (
        <div>
            {/* Last Updated */}
            {lastUpdated && (
                <div className="flex items-center justify-end gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400">
                        Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className="group relative glass-strong rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                    >
                        {/* Gradient Background */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                        />

                        <div className="relative z-10">
                            {/* Icon & Trend */}
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}
                                >
                                    <metric.icon size={28} className="text-white" />
                                </div>

                                {metric.trend && (
                                    <div
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg ${metric.trend === 'up'
                                                ? 'bg-green-500/20 text-green-400'
                                                : metric.trend === 'down'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-blue-500/20 text-blue-400'
                                            }`}
                                    >
                                        {metric.trend === 'up' ? (
                                            <TrendingUp size={14} />
                                        ) : metric.trend === 'down' ? (
                                            <TrendingDown size={14} />
                                        ) : null}
                                        {metric.change !== undefined && (
                                            <span className="text-xs font-semibold">
                                                +{metric.change}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Value & Label */}
                            <h3 className="text-3xl font-bold text-white mb-1">
                                {metric.value.toLocaleString()}
                            </h3>
                            <p className="text-sm text-slate-400">{metric.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="glass rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Signups Today</span>
                        <span className="text-lg font-semibold text-white">
                            {data.signupsToday}
                        </span>
                    </div>
                </div>

                <div className="glass rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">New Books (7d)</span>
                        <span className="text-lg font-semibold text-white">
                            {data.newBooksThisWeek}
                        </span>
                    </div>
                </div>

                <div className="glass rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Books Viewed Today</span>
                        <span className="text-lg font-semibold text-white">
                            {data.booksViewedToday}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
