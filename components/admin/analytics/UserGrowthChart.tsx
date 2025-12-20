'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

interface GrowthDataPoint {
    date: string;
    users: number;
    signups: number;
}

export default function UserGrowthChart() {
    const [data, setData] = useState<GrowthDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/admin/analytics?type=growth&days=${days}`);
            const result = await response.json();
            setData(result);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch growth data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [days]);

    if (loading) {
        return (
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
                <div className="h-80 flex items-center justify-center">
                    <div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">User Growth</h3>
                    <p className="text-sm text-slate-400">Total users over time</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${days === d
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                        }}
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                    />
                    <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#userGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                        {data.length > 0 ? data[data.length - 1].users : 0}
                    </div>
                    <div className="text-xs text-slate-400">Total Users</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                        {data.reduce((sum, d) => sum + d.signups, 0)}
                    </div>
                    <div className="text-xs text-slate-400">New Signups</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-400">
                        {data.length > 0
                            ? ((data.reduce((sum, d) => sum + d.signups, 0) / days) * 30).toFixed(0)
                            : 0}
                    </div>
                    <div className="text-xs text-slate-400">Monthly Rate</div>
                </div>
            </div>
        </div>
    );
}
