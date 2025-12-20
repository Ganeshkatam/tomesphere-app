'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QrCode } from 'lucide-react';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';
import { Loader2, Copy, CheckCircle, Shield } from 'lucide-react';

export default function MFASetup() {
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'success'>('initial');
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        checkMFAStatus();
    }, []);

    const checkMFAStatus = async () => {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) {
            console.error('Error checking MFA:', error);
            return;
        }

        if (data.currentLevel === 'aal2' || data.nextLevel === 'aal2') {
            // Ideally we check if they have verified factors, but AAL2 implies it.
            // For more granularity, we can list factors.
            const { data: factors } = await supabase.auth.mfa.listFactors();
            if (factors?.all?.length && factors.all.some(f => f.status === 'verified')) {
                setIsEnabled(true);
                setStep('success'); // Already enabled
            }
        }
    };

    const startEnrollment = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            });

            if (error) throw error;

            setFactorId(data.id);
            setSecret(data.totp.secret);

            // Generate QR Code
            const qrUrl = await QRCodeLib.toDataURL(data.totp.uri);
            setQrCodeUrl(qrUrl);
            setStep('qr');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to start enrollment');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!factorId) return;
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: verifyCode,
            });

            if (error) throw error;

            toast.success('MFA Enabled Successfully!');
            setIsEnabled(true);
            setStep('success');
        } catch (error: any) {
            console.error(error);
            toast.error('Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        const confirm = window.confirm("Are you sure you want to disable MFA? This will lower your account security.");
        if (!confirm) return;

        setLoading(true);
        // Supabase currently requires Admin API to delete factors usually, 
        // OR the user can unenroll if they have the factor ID.
        // For simplistic implementation, we'll try to unenroll the known factors.
        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');

            if (totpFactor) {
                const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
                if (error) throw error;
                toast.success('MFA Disabled');
                setIsEnabled(false);
                setStep('initial');
            } else {
                toast.error('No active MFA factor found to disable.');
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to disable MFA');
        } finally {
            setLoading(false);
        }
    };


    if (isEnabled && step === 'success') {
        return (
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">MFA is Active</h3>
                        <p className="text-sm text-green-200">Your account is secured with Two-Factor Authentication.</p>
                    </div>
                </div>
                <button
                    onClick={handleDisable}
                    disabled={loading}
                    className="px-4 py-2 border border-green-500/30 text-green-300 hover:bg-green-500/10 rounded-lg transition-colors text-sm"
                >
                    {loading ? 'Disabling...' : 'Disable'}
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-900/50 border border-white/10 rounded-xl space-y-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 shrink-0">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Add an extra layer of security to your account by requiring a code from your authenticator app.
                    </p>
                </div>
            </div>

            {step === 'initial' && (
                <button
                    onClick={startEnrollment}
                    disabled={loading}
                    className="btn btn-primary px-6 py-2 rounded-lg w-full md:w-auto"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Enable MFA
                </button>
            )}

            {step === 'qr' && qrCodeUrl && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                    <div className="bg-white p-4 rounded-xl w-fit mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-slate-300 font-medium">Scan this QR code with your Authenticator App</p>
                        <p className="text-xs text-slate-500">Google Authenticator, Authy, Microsoft Authenticator, etc.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between gap-4">
                        <code className="text-blue-400 font-mono text-sm break-all">{secret}</code>
                        <button
                            onClick={() => { navigator.clipboard.writeText(secret || ''); toast.success('Copied!'); }}
                            className="text-slate-400 hover:text-white"
                        >
                            <Copy size={16} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">Enter the 6-digit code from your app</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                maxLength={6}
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="000 000"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-primary"
                            />
                            <button
                                onClick={handleVerify}
                                disabled={loading || verifyCode.length !== 6}
                                className="btn btn-primary px-6 rounded-lg disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
