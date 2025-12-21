import { useState, useEffect } from 'react';
import { getAuditLogs, AuditLogEntry } from '@/lib/audit';
import { Search, Activity, Calendar, User, FileText } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';

export default function ActivityLogs() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredLogs(logs);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredLogs(logs.filter(log =>
                log.action.toLowerCase().includes(lower) ||
                log.details.toLowerCase().includes(lower) ||
                log.admin_email.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, logs]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs(100);
            setLogs(data);
            setFilteredLogs(data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading activity history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-indigo-400" />
                            Activity Logs
                        </h2>
                        <p className="text-slate-400 text-sm">Track administrative actions and system events</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search logs by action, admin, or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <VoiceInput onTranscript={setSearchTerm} />
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No logs found</h3>
                        <p className="text-slate-400">
                            {searchTerm ? 'Try adjusting your search terms' : 'No activity recorded yet'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {filteredLogs.map((log) => (
                            <div key={log.id || Math.random()} className="p-4 hover:bg-white/5 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                        <Activity size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-white font-medium truncate">{log.action}</h4>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                                                <Calendar size={12} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-2">{log.details}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <User size={12} />
                                            <span>{log.admin_email}</span>
                                            {log.ip_address && (
                                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                                    {log.ip_address}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
