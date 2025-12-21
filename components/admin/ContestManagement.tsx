'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Calendar, Trophy, Users, Search, Filter } from 'lucide-react';
import ContestForm from './ContestForm';
import VoiceInput from '@/components/ui/VoiceInput';

export default function ContestManagement() {
    const [contests, setContests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingContest, setEditingContest] = useState<any | null>(null);

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;
            setContests(data || []);
        } catch (error) {
            console.error('Error fetching contests:', error);
            toast.error('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contest?')) return;

        try {
            const { error } = await supabase
                .from('contests')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Contest deleted');
            fetchContests();
        } catch (error) {
            toast.error('Failed to delete contest');
        }
    };

    const filteredContests = contests.filter(contest => {
        const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || contest.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="text-center py-8 text-slate-400">Loading contests...</div>;

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search contests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <VoiceInput onTranscript={setSearchTerm} />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>
                </div>

                <button
                    onClick={() => {
                        setEditingContest(null);
                        setShowForm(true);
                    }}
                    className="btn btn-primary px-6 py-2 rounded-xl flex items-center gap-2 w-full md:w-auto justify-center"
                >
                    <Plus size={18} />
                    Create Contest
                </button>
            </div>

            {/* Contests Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredContests.map((contest) => (
                    <div key={contest.id} className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800">
                                    {contest.image_url ? (
                                        <img src={contest.image_url} alt={contest.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{contest.title}</h3>
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide mt-1 ${contest.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                        contest.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {contest.status}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingContest(contest);
                                        setShowForm(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(contest.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>{new Date(contest.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-500" />
                                <span className="text-yellow-500 font-bold">{contest.prize_xp} XP</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredContests.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No contests found matching your filters.
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <ContestForm
                    contest={editingContest}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchContests();
                    }}
                />
            )}
        </div>
    );
}
