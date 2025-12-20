'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X, Upload, Calendar, Trophy, Image as ImageIcon } from 'lucide-react';

interface ContestFormProps {
    contest?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ContestForm({ contest, onClose, onSuccess }: ContestFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        prize_xp: 500,
        image_url: '',
        status: 'upcoming'
    });

    useEffect(() => {
        if (contest) {
            setFormData({
                title: contest.title,
                description: contest.description,
                start_date: new Date(contest.start_date).toISOString().slice(0, 16),
                end_date: new Date(contest.end_date).toISOString().slice(0, 16),
                prize_xp: contest.prize_xp,
                image_url: contest.image_url || '',
                status: contest.status
            });
        }
    }, [contest]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString()
            };

            if (contest) {
                // Update
                const { error } = await supabase
                    .from('contests')
                    .update(dataToSave)
                    .eq('id', contest.id);
                if (error) throw error;
                toast.success('Contest updated successfully');
            } else {
                // Create
                const { error } = await supabase
                    .from('contests')
                    .insert(dataToSave);
                if (error) throw error;
                toast.success('Contest created successfully');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving contest:', error);
            toast.error('Failed to save contest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                        {contest ? 'Edit Contest' : 'Create New Contest'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Contest Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Summer Reading Sprint"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Describe the rules and goals..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Prize & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Prize (XP)</label>
                            <div className="relative">
                                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    name="prize_xp"
                                    value={formData.prize_xp}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="active">Active</option>
                                <option value="past">Past</option>
                            </select>
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Cover Image URL</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="url"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary px-8 py-2 rounded-xl flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Save Contest
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
