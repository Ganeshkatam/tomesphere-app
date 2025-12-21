'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Search,
    MoreVertical,
    Shield,
    User as UserIcon,
    Ban,
    Trash2
} from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { logAdminAction } from '@/lib/audit';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

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
        } catch (error) {
            console.error('Error fetching users:', error);
            showError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getUserInitials = (name: string) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
    };

    const toggleRole = async (userId: string, currentRole: string, email: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showSuccess(`User role updated to ${newRole}`);
            logAdminAction('USER_ROLE_UPDATE', `Changed role for ${email} to ${newRole}`);
        } catch (error) {
            showError('Failed to update role');
        }
    };

    const handleBanUser = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to BAN user ${email}? This will restrict their access.`)) return;

        try {
            // For now, we simulate a ban by setting a flag or just logging it if 'is_banned' column doesn't exist
            // Assuming 'is_banned' column might not exist, we'll try to update 'role' to 'banned' or similar
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'banned' })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: 'banned' } : u));
            showSuccess(`User ${email} has been banned`);
            logAdminAction('USER_BAN', `Banned user ${email}`);
        } catch (error: any) {
            showError('Failed to ban user: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`DANGER: Are you sure you want to PERMANENTLY DELETE ${email}? This cannot be undone.`)) return;

        try {
            // In Supabase, deleting a user from 'auth.users' is strict. We might strictly delete from 'profiles' if foreign keys allow.
            // Or call an edge function. For this client-side admin, we'll try deleting the profile.
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== userId));
            showSuccess(`User ${email} deleted`);
            logAdminAction('USER_DELETE', `Deleted user profile ${email}`);
        } catch (error: any) {
            showError('Failed to delete user: ' + error.message);
        }
    };

    return (
        <AdminAuthGuard>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                        <p className="text-slate-400">Manage {users.length} registered users.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                            title="Refresh"
                        >
                            🔄
                        </button>
                        <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2">
                            <UserIcon size={18} />
                            Add User
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder-slate-600"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'admin', 'user'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role as any)}
                                className={`px-4 py-2 rounded-xl capitalize font-medium transition-all ${filterRole === role
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            No users found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            getUserInitials(user.name || user.email)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{user.name || 'Anonymous'}</div>
                                                        <div className="text-sm text-slate-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleRole(user.id, user.role || 'user', user.email)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${user.role === 'admin'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {user.role === 'admin' && <Shield size={12} />}
                                                    {user.role || 'user'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                {user.is_student ? (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                        Student
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                                        Regular
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right relative">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleBanUser(user.id, user.email)}
                                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-orange-400 transition-colors"
                                                        title="Ban User">
                                                        <Ban size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                        className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 transition-colors"
                                                        title="Delete User">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (Visual only for now) */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-400">
                        <div>Showing {filteredUsers.length} of {users.length} users</div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50" disabled>Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminAuthGuard>
    );
}
