'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Activity, Clock, Shield, Ban, Key, MessageCircle, TrendingUp, BookOpen, Eye } from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface UserDetailModalProps {
    userId: string;
    onClose: () => void;
    onUserUpdated: () => void;
}

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
    login_count?: number;
    engagement_score?: number;
    student_verification?: string;
}

interface ActivityLog {
    id: string;
    action_type: string;
    action_data: any;
    created_at: string;
}

interface LoginRecord {
    id: string;
    login_at: string;
    ip_address?: string;
    success: boolean;
}

export default function UserDetailModal({ userId, onClose, onUserUpdated }: UserDetailModalProps) {
    const [user, setUser] = useState<UserData | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [logins, setLogins] = useState<LoginRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'logins'>('overview');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            // Fetch user profile
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) throw userError;
            setUser(userData);

            // Fetch recent activities (last 50)
            const { data: activityData } = await supabase
                .from('user_activity_log')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            setActivities(activityData || []);

            // Fetch recent logins (last 20)
            const { data: loginData } = await supabase
                .from('login_history')
                .select('*')
                .eq('user_id', userId)
                .order('login_at', { ascending: false })
                .limit(20);

            setLogins(loginData || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
            showError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async () => {
        const reason = prompt('Enter ban reason:');
        if (!reason) return;

        setProcessing(true);
        try {
            const { error } = await supabase.from('user_bans').insert({
                user_id: userId,
                reason,
                banned_by: (await supabase.auth.getUser()).data.user?.id,
                is_active: true,
            });

            if (error) throw error;

            showSuccess('User banned successfully');
            onUserUpdated();
            fetchUserData();
        } catch (error) {
            console.error('Error banning user:', error);
            showError('Failed to ban user');
        } finally {
            setProcessing(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;

        if (!confirm(`Send password reset email to ${user.email}?`)) return;

        setProcessing(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email);

            if (error) throw error;

            showSuccess('Password reset email sent');
        } catch (error) {
            console.error('Error sending reset email:', error);
            showError('Failed to send reset email');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getActionIcon = (actionType: string) => {
        if (actionType.includes('login')) return '🔐';
        if (actionType.includes('book')) return '📚';
        if (actionType.includes('read')) return '📖';
        if (actionType.includes('review')) return '⭐';
        if (actionType.includes('search')) return '🔍';
        return '📝';
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                            <User size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <p className="text-slate-400">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-6 border-b border-white/10 bg-white/5">
                    {[
                        { id: 'overview', label: 'Overview', icon: User },
                        { id: 'activity', label: 'Activity', icon: Activity },
                        { id: 'logins', label: 'Logins', icon: Shield },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="gridgrid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Activity size={20} className="text-green-400" />
                                        <span className="text-sm text-slate-400">Engagement</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {user.engagement_score || 0}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock size={20} className="text-blue-400" />
                                        <span className="text-sm text-slate-400">Logins</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {user.login_count || 0}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar size={20} className="text-purple-400" />
                                        <span className="text-sm text-slate-400">Member Since</span>
                                    </div>
                                    <div className="text-sm font-medium text-white">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                                <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>

                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-slate-400" />
                                    <span className="text-slate-300">{user.email}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Shield size={18} className="text-slate-400" />
                                    <span className="text-slate-300 capitalize">{user.role}</span>
                                </div>

                                {user.last_login_at && (
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className="text-slate-400" />
                                        <span className="text-slate-300">
                                            Last login: {formatDate(user.last_login_at)}
                                        </span>
                                    </div>
                                )}

                                {user.student_verification && (
                                    <div className="flex items-center gap-3">
                                        <Shield size={18} className="text-green-400" />
                                        <span className="text-green-300">
                                            Verified Student ({user.student_verification})
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Admin Actions */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={handleBanUser}
                                        disabled={processing}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Ban size={18} />
                                        <span>Ban User</span>
                                    </button>

                                    <button
                                        onClick={handleResetPassword}
                                        disabled={processing}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Key size={18} />
                                        <span>Reset Password</span>
                                    </button>

                                    <button
                                        disabled={processing}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <MessageCircle size={18} />
                                        <span>Send Message</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Recent Activity ({activities.length})
                            </h3>
                            {activities.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No activity yet</p>
                            ) : (
                                activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{getActionIcon(activity.action_type)}</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-white capitalize">
                                                    {activity.action_type.replace(/_/g, ' ')}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {formatDate(activity.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'logins' && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Login History ({logins.length})
                            </h3>
                            {logins.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No login history</p>
                            ) : (
                                logins.map((login) => (
                                    <div
                                        key={login.id}
                                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield
                                                    size={20}
                                                    className={login.success ? 'text-green-400' : 'text-red-400'}
                                                />
                                                <div>
                                                    <div className="text-white">
                                                        {login.success ? 'Successful' : 'Failed'} Login
                                                    </div>
                                                    {login.ip_address && (
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            IP: {login.ip_address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                {formatDate(login.login_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
