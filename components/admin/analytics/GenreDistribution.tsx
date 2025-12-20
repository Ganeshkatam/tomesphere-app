'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GenreData {
    genre: string;
    count: number;
    percentage: number;
}

const COLORS = [
    '#6366f1', // Indigo
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#8b5cf6', // Violet
];

export default function GenreDistribution() {
    const [data, setData] = useState<GenreData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/admin/analytics?type=genres');
            const result = await response.json();
            setData(result.slice(0, 8)); // Top 8 genres
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch genre data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Genre Distribution</h3>
                <p className="text-sm text-slate-400">Most popular book genres</p>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-6">
                {data.map((genre, index) => (
                    <div key={genre.genre} className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{genre.genre}</div>
                            <div className="text-xs text-slate-400">
                                {genre.count} books ({genre.percentage}%)
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
