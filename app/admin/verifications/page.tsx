'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check,
    X,
    ExternalLink,
    Mail,
    FileText,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { logAdminAction } from '@/lib/audit';

export default function VerificationQueue() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('student_verifications')
                .select(`
                    *,
                    profiles:user_id (email, name)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            showError('Failed to load requests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (id: string, userId: string, approve: boolean) => {
        setProcessingId(id);
        try {
            // 1. Update verification status
            const { error: verifyError } = await supabase
                .from('student_verifications')
                .update({
                    status: approve ? 'approved' : 'rejected',
                    processed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (verifyError) throw verifyError;

            // 2. If approved, update user profile
            if (approve) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        is_student: true,
                        role: 'user' // Ensure valid role
                    })
                    .eq('id', userId);

                if (profileError) throw profileError;
            }

            await logAdminAction(
                approve ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
                `Processed student verification for user ID ${userId}. Status: ${approve ? 'Approved' : 'Rejected'}`
            );

            showSuccess(approve ? 'Student verified successfully!' : 'Request rejected');

            // Remove from local list
            setRequests(prev => prev.filter(r => r.id !== id));

        } catch (error: any) {
            console.error('Action failed:', error);
            showError(error.message || 'Action failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-400">Loading requests...</div>;

    return (
        <AdminAuthGuard>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Verification Queue</h1>
                        <p className="text-slate-400">Review pending student ID submissions.</p>
                    </div>
                    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-sm font-medium">
                        {requests.length} Pending
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-white/5 rounded-2xl border-dashed">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Check size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                        <p className="text-slate-400">No pending verification requests at the moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => (
                            <div key={request.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors animate-in slide-in-from-bottom-2">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Document Preview */}
                                    <div className="w-full md:w-64 h-48 bg-black rounded-xl overflow-hidden relative group shrink-0 border border-white/10">
                                        {request.document_url ? (
                                            <img
                                                src={request.document_url}
                                                alt="ID Document"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                <FileText size={40} />
                                            </div>
                                        )}
                                        <a
                                            href={request.document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <span className="flex items-center gap-2 text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors">
                                                <ExternalLink size={16} /> View Full
                                            </span>
                                        </a>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{request.profiles?.name || 'Unknown User'}</h3>
                                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                                    <Mail size={14} />
                                                    {request.email || request.profiles?.email}
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                Pending
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-white/5 p-3 rounded-lg">
                                                <span className="text-slate-500 block text-xs mb-1">Institution</span>
                                                <span className="text-white font-medium">{request.institution_name || 'Not specified'}</span>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-lg">
                                                <span className="text-slate-500 block text-xs mb-1">Submitted On</span>
                                                <span className="text-white font-medium flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {request.verification_method === 'manual_review' && (
                                            <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-lg">
                                                <AlertCircle size={14} />
                                                Manual ID Card Review Required
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                                        <button
                                            onClick={() => handleVerification(request.id, request.user_id, true)}
                                            disabled={!!processingId}
                                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingId === request.id ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Check size={18} /> Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleVerification(request.id, request.user_id, false)}
                                            disabled={!!processingId}
                                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <X size={18} /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminAuthGuard>
    );
}
