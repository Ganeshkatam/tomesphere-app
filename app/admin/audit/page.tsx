'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, AuditLogEntry } from '@/lib/audit';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { FileText, Search, RefreshCw, Calendar, Download } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data as AuditLogEntry[]);
        setLoading(false);
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminAuthGuard>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">System Audit Logs</h1>
                        <p className="text-slate-400">Track and monitor all administrative actions for compliance.</p>
                    </div>
                    <button
                        onClick={loadLogs}
                        className="btn btn-secondary flex items-center gap-2 w-fit"
                    >
                        <RefreshCw size={18} /> Refresh Log
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-strong rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search logs by action, admin, or details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                    <button className="btn btn-ghost border border-white/10 flex items-center gap-2">
                        <Calendar size={18} /> Date Range
                    </button>
                    <button className="btn btn-ghost border border-white/10 flex items-center gap-2">
                        <Download size={18} /> Export CSV
                    </button>
                </div>

                {/* Logs Table */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Performed By</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            Loading system logs...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            No logs found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-white/5 transition-colors font-mono text-sm">
                                            <td className="p-4 text-slate-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${log.action.includes('DELETE') || log.action.includes('BAN') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        log.action.includes('UPDATE') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-green-500/10 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white">
                                                {log.admin_email}
                                            </td>
                                            <td className="p-4 text-slate-300">
                                                {log.details}
                                            </td>
                                            <td className="p-4 text-slate-600 text-right text-xs">
                                                {log.id.substring(0, 8)}...
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminAuthGuard>
    );
}
