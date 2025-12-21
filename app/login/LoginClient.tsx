'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'react-hot-toast';
import { showError, showSuccess } from '@/lib/toast';
import { Lock, Mail, Smartphone, ArrowRight, Globe, ChevronDown, Sparkles } from 'lucide-react';

const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' }
];

export default function EnhancedLoginPage() {
    const [input, setInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'password' | 'otp' | 'mfa'>('input');
    const [mfaCode, setMfaCode] = useState('');
    const [authMode, setAuthMode] = useState<'password' | 'magic'>('password');
    const [otp, setOtp] = useState('');
    const [isPhone, setIsPhone] = useState(false);
    const [countryCode, setCountryCode] = useState('+91');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const router = useRouter();

    const detectInputType = (value: string): 'email' | 'phone' | 'unknown' => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10,15}$/;

        if (emailRegex.test(value)) return 'email';
        if (phoneRegex.test(value) || /^\+\d{10,15}$/.test(value)) return 'phone';
        return 'unknown';
    };

    const handleInputChange = (value: string) => {
        setInput(value);
        const type = detectInputType(value);
        setIsPhone(type === 'phone');
    };

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();

        const type = detectInputType(input);
        if (type === 'unknown') {
            showError('Please enter a valid email or phone number');
            return;
        }

        if (authMode === 'magic') {
            await handleMagicLinkLogin(e);
        } else {
            // Password mode: just move to password step
            // In a real app check if user exists first, but for now we trust the flow
            setStep('password');
        }
    };

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fullIdentifier = isPhone ? `${countryCode}${input}` : input;

            // Check if phone (SMS OTP) or Email (Magic Link/OTP)
            if (isPhone) {
                const { error } = await supabase.auth.signInWithOtp({
                    phone: fullIdentifier,
                });
                if (error) throw error;
                showSuccess('SMS code sent!');
            } else {
                const { error } = await supabase.auth.signInWithOtp({
                    email: input,
                    options: { shouldCreateUser: false }
                });
                if (error) throw error;
                showSuccess('Magic code sent to your email!');
            }

            setStep('otp');
        } catch (error: any) {
            console.error(error);
            showError(error.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };



    const checkMFA = async () => {
        try {
            const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (error) throw error;

            console.log('MFA Level:', data);

            if (data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
                setStep('mfa');
                return true; // MFA required
            }
            return false; // No MFA needed or already verified
        } catch (error) {
            console.error('Error checking MFA:', error);
            return false;
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fullIdentifier = isPhone ? `${countryCode}${input}` : input;

            let signInResult;

            if (isPhone) {
                signInResult = await supabase.auth.signInWithPassword({
                    phone: fullIdentifier,
                    password
                });
            } else {
                signInResult = await supabase.auth.signInWithPassword({
                    email: input,
                    password
                });
            }

            const { data, error } = signInResult;

            if (error) throw error;

            // Check if MFA is enabled for this user
            const mfaRequired = await checkMFA();
            if (mfaRequired) {
                setLoading(false);
                return; // Stop here and show MFA screen
            }

            showSuccess('Logged in successfully!');
            router.push('/home');
        } catch (error: any) {
            showError(error.message || 'Invalid password');
            setLoading(false);
        }
    };

    const handleMFAVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.all?.find(f => f.factor_type === 'totp');

            if (!totpFactor) {
                throw new Error('No MFA factor found');
            }

            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: totpFactor.id,
                code: mfaCode,
            });

            if (error) throw error;

            showSuccess('MFA Verified! Logging in...');
            router.push('/home');
        } catch (error: any) {
            console.error(error);
            showError(error.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    // ... existing OTP logic ...

    // Render logic update for MFA step
    if (step === 'mfa') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                            <Lock className="text-indigo-400" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Auth</h1>
                        <p className="text-slate-400">Enter the 6-digit code from your authenticator app</p>
                    </div>

                    <form onSubmit={handleMFAVerify} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-center text-xl tracking-[0.5em] font-mono"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || mfaCode.length !== 6}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fullIdentifier = isPhone ? `${countryCode}${input}` : input;

            let verifyResult;

            if (isPhone) {
                verifyResult = await supabase.auth.verifyOtp({
                    phone: fullIdentifier,
                    token: otp,
                    type: 'sms'
                });
            } else {
                verifyResult = await supabase.auth.verifyOtp({
                    email: input,
                    token: otp,
                    type: 'email'
                });
            }

            const { data, error } = verifyResult;

            if (error) throw error;

            showSuccess('Verified! Logging in...');
            router.push('/home');
        } catch (error: any) {
            showError(error.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    // Google Sign-In helper (placeholder)
    const handleGoogleSignIn = async () => {
        // Implement real Google Auth logic here
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/home` }
        });
        if (error) showError(error.message);
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-center justify-center p-4">
            <Toaster position="top-right" />

            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
            </div>

            <div className="w-full max-w-md relative z-10 glass-card p-8 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Continue your reading journey</p>
                </div>

                {/* Auth Mode Toggle */}
                {step === 'input' && (
                    <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/10">
                        <button
                            onClick={() => setAuthMode('password')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${authMode === 'password'
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Password
                        </button>
                        <button
                            onClick={() => setAuthMode('magic')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${authMode === 'magic'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <Sparkles size={14} />
                                Magic Code
                            </span>
                        </button>
                    </div>
                )}

                {step === 'input' && (
                    <form onSubmit={handleContinue} className="space-y-6">
                        <div className="space-y-4">
                            {/* Input Field */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    {isPhone ? (
                                        <Smartphone className="text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                    ) : (
                                        <Mail className="text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                    )}
                                </div>

                                <div className="flex">
                                    {isPhone && (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                                className="h-full px-3 bg-white/5 border-y border-l border-white/10 rounded-l-xl text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                                            >
                                                <span>{COUNTRY_CODES.find(c => c.code === countryCode)?.flag}</span>
                                                <span className="text-sm">{countryCode}</span>
                                                <ChevronDown size={14} />
                                            </button>

                                            {showCountryDropdown && (
                                                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                                    {COUNTRY_CODES.map((country) => (
                                                        <button
                                                            key={country.code}
                                                            type="button"
                                                            onClick={() => {
                                                                setCountryCode(country.code);
                                                                setShowCountryDropdown(false);
                                                            }}
                                                            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
                                                        >
                                                            <span className="text-xl">{country.flag}</span>
                                                            <span className="text-slate-300">{country.country}</span>
                                                            <span className="ml-auto text-slate-500 text-sm">{country.code}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <input
                                        type={isPhone ? "tel" : "text"}
                                        value={input}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        className={`w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all ${isPhone ? 'rounded-r-xl border-l-0' : 'pl-12 rounded-xl py-4'
                                            } px-4 py-4`}
                                        placeholder={isPhone ? "Phone number" : "Email or Phone"}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !input}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 group transition-all ${authMode === 'magic'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg'
                                : 'btn btn-primary'
                                }`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {authMode === 'password' ? 'Continue' : 'Send Magic Code'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#0a0f1c] text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google One Tap
                        </button>
                    </form>
                )}

                {step === 'password' && (
                    <form onSubmit={handlePasswordLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {input.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-slate-400">Logging in as</p>
                                        <p className="text-white font-medium">{input}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('input');
                                        setPassword('');
                                    }}
                                    className="text-xs text-primary hover:text-primary-light"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-4 pl-12 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full btn btn-primary py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Login"
                            )}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <Mail className="text-indigo-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                            <p className="text-slate-400 text-sm">
                                We sent a magic code to <span className="text-white font-medium">{input}</span>
                            </p>
                        </div>

                        <div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white text-center text-2xl tracking-widest px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Verify & Login"
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep('input')}
                                className="text-sm text-slate-500 hover:text-white transition-colors"
                            >
                                Wrong email? Go back
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 text-center text-slate-500 text-sm">
                    Don't have an account?{" "}
                    <button onClick={() => router.push('/signup')} className="text-primary hover:text-primary-light font-medium transition-colors">
                        Sign up free
                    </button>
                </div>
            </div>
        </div>
    );
}
