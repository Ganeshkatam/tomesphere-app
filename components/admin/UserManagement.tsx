'use client';

import { useState, useEffect } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';
import VoiceInput from '@/components/ui/VoiceInput';

export default function UserManagement() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
            setLoading(false);
        } catch (error) {
            showError('Failed to load users');
            setLoading(false);
        }
    };

    const toggleUserRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';

        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u))
            );
            showSuccess(`Role updated to ${newRole}`);
        } catch (error) {
            showError('Failed to update role');
        }
    };

    const filteredUsers = users.filter(
        u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'user'
    });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        // const loadingToast = toast.loading('Creating user...');

        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            // toast.dismiss(loadingToast);
            showSuccess('User created successfully!');
            setShowCreateModal(false);
            setFormData({ email: '', password: '', name: '', role: 'user' });
            fetchUsers(); // Refresh list
        } catch (error: any) {
            // toast.dismiss(loadingToast);
            showError(error.message || 'Failed to create user');
        }
    };

    if (loading) {
        return <div className="spinner mx-auto" />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                        User Management
                    </h3>
                    <p className="text-slate-400">Total Members: <span className="text-white font-semibold">{users.length}</span></p>
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <span>+</span> Add User
                    </button>
                    <div className="relative w-full md:w-72 group">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-500 glass"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <VoiceInput onTranscript={setSearchTerm} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Add New User</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-12 text-white focus:border-indigo-500/50 focus:outline-none"
                                        placeholder="John Doe"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <VoiceInput onTranscript={(text) => setFormData(prev => ({ ...prev, name: text }))} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/50 focus:outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/50 focus:outline-none"
                                    placeholder="Minimum 6 characters"
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/50 focus:outline-none"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {filteredUsers.map((user, index) => (
                    <div
                        key={user.id}
                        className="glass-card rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${user.role === 'admin'
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
                                }`}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-white font-medium group-hover:text-indigo-300 transition-colors">{user.name}</h4>
                                <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                    }`}
                            >
                                {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                            </span>
                            <button
                                onClick={() => toggleUserRole(user.id, user.role)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/20"
                            >
                                {user.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-white/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                    <p className="text-slate-400">Try adjusting your search terms</p>
                </div>
            )}
        </div>
    );
}
