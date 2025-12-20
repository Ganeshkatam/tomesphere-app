'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users,
    BookOpen,
    ShieldAlert,
    TrendingUp,
    Clock,
    Activity,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { getAuditLogs } from '@/lib/audit';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBooks: 0,
        pendingVerifications: 0,
        recentSignups: 0
    });
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchAuditSample();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch total users
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Fetch total books
            const { count: booksCount } = await supabase
                .from('books')
                .select('*', { count: 'exact', head: true });

            // Fetch pending verifications
            const { count: pendingCount } = await supabase
                .from('student_verifications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            setStats({
                totalUsers: usersCount || 0,
                totalBooks: booksCount || 0,
                pendingVerifications: pendingCount || 0,
                recentSignups: 0 // Placeholder
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditSample = async () => {
        const logs = await getAuditLogs(5);
        if (logs) setAuditLogs(logs);
    };

    const StatCard = ({ title, value, icon: Icon, color, link, subtext }: any) => (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all hover:shadow-lg hover:shadow-black/20 group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-slate-400 font-medium text-sm tracking-wide uppercase">{title}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{loading ? '-' : value}</span>
                        {subtext && <span className="text-xs text-green-400 font-medium flex items-center"><TrendingUp size={12} className="mr-1" />{subtext}</span>}
                    </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 shadow-inner`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
            {link && (
                <Link href={link} className="text-indigo-400 text-sm font-medium hover:text-indigo-300 flex items-center gap-1 group/link">
                    View Details
                    <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                </Link>
            )}
        </div>
    );

    return (
        <AdminAuthGuard>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                    <p className="text-slate-400">Welcome back, Administrator. System performance is nominal.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={Users}
                        color="from-indigo-500 to-purple-500"
                        link="/admin/users"
                        subtext="Database Active"
                    />
                    <StatCard
                        title="Total Books"
                        value={stats.totalBooks}
                        icon={BookOpen}
                        color="from-blue-500 to-cyan-500"
                        link="/admin/books"
                        subtext="Catalog Active"
                    />
                    <StatCard
                        title="Pending Verifications"
                        value={stats.pendingVerifications}
                        icon={ShieldAlert}
                        color="from-orange-500 to-red-500"
                        link="/admin/verifications"
                        subtext="Action needed"
                    />
                    <StatCard
                        title="System Audit"
                        value="Active"
                        icon={Activity}
                        color="from-green-500 to-emerald-500"
                        link="/admin/audit"
                        subtext="Logging enabled"
                    />
                </div>

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Audit Logs */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Clock size={20} className="text-indigo-400" />
                                Real-time Audit Log
                            </h3>
                            <Link href="/admin/audit" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {auditLogs.map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border-l-2 border-indigo-500/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <FileText size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{log.action}</p>
                                            <p className="text-xs text-slate-400">{log.details}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />

                        <h3 className="text-lg font-bold text-white mb-6 relative z-10">Administrative Tools</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <Link href="/admin/books" className="p-4 rounded-xl bg-slate-800/80 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all group text-center">
                                <BookOpen size={24} className="mx-auto mb-2 text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Add Database Entry</span>
                            </Link>
                            <Link href="/admin/verifications" className="p-4 rounded-xl bg-slate-800/80 border border-white/10 hover:bg-orange-600/20 hover:border-orange-500/50 transition-all group text-center">
                                <ShieldAlert size={24} className="mx-auto mb-2 text-orange-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Security Review</span>
                            </Link>
                            <Link href="/admin/audit" className="col-span-2 p-4 rounded-xl bg-slate-800/80 border border-white/10 hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all group text-center flex items-center justify-center gap-2">
                                <Activity size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">System Diagnostics & Logs</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminAuthGuard>
    );
}
