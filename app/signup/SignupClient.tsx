'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess, showWarning } from '@/lib/toast';
import { validateEmail, validateEmailQuick } from '@/lib/emailValidation';
import { detectInputType } from '@/lib/inputDetection';
import { FadeIn, SlideUp, ScaleIn } from '@/components/ui/motion';
import WelcomeTour from '@/components/WelcomeTour';

function SignupForm() {
    const [name, setName] = useState('');
    const [input, setInput] = useState(''); // Email or Phone
    const [inputType, setInputType] = useState<'email' | 'phone' | 'unknown'>('unknown');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [validatingEmail, setValidatingEmail] = useState(false);
    const [step, setStep] = useState<'input' | 'otp'>('input');
    const [otp, setOtp] = useState('');
    const [showTour, setShowTour] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();


    // Input type detection and validation
    useEffect(() => {
        const type = detectInputType(input);
        setInputType(type);

        if (!input || type === 'phone') {
            setEmailError(null);
            setEmailSuggestion(null);
            return;
        }

        const timer = setTimeout(async () => {
            const quickValidation = validateEmailQuick(input);

            if (!quickValidation.isValid) {
                setEmailError(quickValidation.error!);
                setEmailSuggestion(null);
            } else if (quickValidation.suggestion) {
                setEmailSuggestion(quickValidation.suggestion);
                setEmailError(null);
            } else {
                setEmailError(null);
                setEmailSuggestion(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [input]);

    const acceptSuggestion = () => {
        if (emailSuggestion) {
            setInput(emailSuggestion);
            setEmailSuggestion(null);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setValidatingEmail(true);

        try {
            // Full email validation with duplicate check
            const checkDuplicate = async (email: string) => {
                const { data } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('email', email)
                    .single();
                return !!data;
            };

            const type = detectInputType(input);

            // Phone signup with OTP
            if (type === 'phone') {
                // Fix: Check if input already has country code +
                const cleanInput = input.replace(/[\s-]/g, '');
                const formattedPhone = cleanInput.startsWith('+') ? cleanInput : `+91${cleanInput}`;

                try {
                    const { error: otpError } = await supabase.auth.signUp({
                        phone: formattedPhone,
                        password,
                        options: {
                            data: { name }
                        }
                    });

                    if (otpError) {
                        // If error mentions SMS/Twilio, show helpful message
                        if (otpError.message.includes('SMS') || otpError.message.includes('phone')) {
                            showWarning('Phone authentication not configured. Please configure Twilio in Supabase or use email signup.');
                        } else {
                            throw otpError;
                        }
                        setLoading(false);
                        setValidatingEmail(false);
                        return;
                    }

                    showSuccess('Verification code sent to your phone!');
                    setStep('otp');
                    setLoading(false);
                    setValidatingEmail(false);
                    return;
                } catch (error: any) {
                    showError(error.message || 'Failed to send OTP. Please try email signup.');
                    setLoading(false);
                    setValidatingEmail(false);
                    return;
                }
            }

            // Email signup
            const validation = await validateEmail(input, checkDuplicate);

            if (!validation.isValid) {
                setValidatingEmail(false);
                setLoading(false);
                showError(validation.error!);
                return;
            }

            const finalEmail = validation.normalized!;

            // Sign up the user with email confirmation ENABLED
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: finalEmail,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/home`,
                    data: {
                        name,
                    },
                },
            });

            if (authError) {
                // Check if user already exists
                if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                    throw new Error('This email is already registered. Try signing in instead.');
                }
                throw authError;
            }

            // Check if user was created and session exists
            if (authData.user && authData.session) {
                // Try to create profile - but don't fail signup if profile creation fails
                try {
                    const profileData: any = {
                        id: authData.user.id,
                        email: authData.user.email,
                        name: name,
                        role: 'user',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    // Add phone_number if user signed up with phone
                    if (inputType === 'phone') {
                        profileData.phone_number = input.startsWith('+') ? input : `+${input}`;
                    }

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert(profileData, {
                            onConflict: 'id'
                        });

                    if (profileError) {
                        console.warn('Profile creation had an issue (may be handled by trigger):', profileError.message);
                    }
                } catch (profileErr) {
                    console.warn('Profile creation skipped - trigger will handle:', profileErr);
                }

                showSuccess('Account created successfully! 🎉');

                // Always redirect to home for new users - no profile setup required
                setTimeout(() => {
                    router.push('/home');
                }, 1500);
            } else if (authData.user && !authData.session) {
                // Email confirmation required
                showSuccess('Account created! Check your email to verify.');
                setTimeout(() => {
                    router.push('/home');
                }, 1500);
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            // Show user-friendly error message
            const errorMessage = error.message || 'Failed to create account';
            if (errorMessage.includes('Database')) {
                showWarning('Account created but profile setup pending. You can continue to login.');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return; // Return early to prevent further execution
            } else {
                showError(errorMessage);
            }
        } finally {
            setLoading(false);
            setValidatingEmail(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, nextFieldId?: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextFieldId) {
                document.getElementById(nextFieldId)?.focus();
            } else if (name && password && confirmPassword) {
                handleSignup(e as any);
            }
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/home`,
                }
            });

            if (error) {
                if (error.message.includes('not enabled')) {
                    showWarning('Google Sign-Up not configured. Please use email/phone or contact admin.');
                } else {
                    throw error;
                }
            }
        } catch (error: any) {
            console.error('Google Sign-Up Error:', error);
            showError(error.message || 'Failed to sign up with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-start justify-center p-4 sm:p-6 md:py-12 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
            </div>

            {/* <Toaster position="top-right" /> */}

            <div className="w-full max-w-md relative z-10">
                <FadeIn className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-white mb-2">
                        Create Account
                    </h1>
                    <p className="text-slate-400">
                        Join TomeSphere and start discovering books
                    </p>
                </FadeIn>

                <SlideUp className="glass-strong rounded-2xl p-8 shadow-2xl border border-white/10">
                    {step === 'otp' ? (
                        /* OTP Verification Screen */
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setLoading(true);

                            try {
                                const { error } = await supabase.auth.verifyOtp({
                                    phone: input.startsWith('+') ? input : `+91${input}`,
                                    token: otp,
                                    type: 'sms'
                                });

                                if (error) throw error;

                                showSuccess('Phone verified! Account created! 🎉');
                                setTimeout(() => router.push('/home'), 1500);
                            } catch (error: any) {
                                showError(error.message || 'Invalid OTP. Please try again.');
                                setLoading(false);
                            }
                        }} className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Enter Verification Code</h3>
                                <p className="text-slate-400 text-sm">
                                    We sent a code to {input.startsWith('+') ? input : `+91${input}`}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    maxLength={6}
                                    autoFocus
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Enter the 6-digit code from your SMS
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold text-lg"
                            >
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('input');
                                    setOtp('');
                                }}
                                className="w-full text-slate-400 hover:text-white transition-colors text-sm"
                            >
                                ← Back to signup
                            </button>
                        </form>
                    ) : (
                        /* Main Signup Form */
                        <form onSubmit={handleSignup} className="space-y-5">
                            <div>
                                <label htmlFor="input" className="block text-sm font-medium mb-2 text-slate-300">
                                    Email or Phone Number
                                </label>
                                <input
                                    type="text"
                                    id="input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => handleKeyPress(e, 'name')}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    placeholder="your@email.com or 8317527188"
                                    autoComplete="off"
                                    required
                                    disabled={loading}
                                />
                                {inputType !== 'unknown' && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        {inputType === 'email' ? '📧 Email detected' : '📱 Phone number detected'}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 For phone signup: Configure Twilio in Supabase first
                                </p>
                                {emailSuggestion && (
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <span className="text-amber-400">💡 Did you mean</span>
                                        <button
                                            type="button"
                                            onClick={acceptSuggestion}
                                            className="text-primary-light hover:underline font-medium"
                                        >
                                            {emailSuggestion}
                                        </button>
                                        <span className="text-slate-400">?</span>
                                    </div>
                                )}
                            </div>
                            {emailError && (
                                <ScaleIn className="mt-2 text-sm text-red-400 flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{emailError}</span>
                                </ScaleIn>
                            )}

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2 text-slate-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, 'password')}
                                    placeholder="Enter your name"
                                    autoComplete="off"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, 'confirmPassword')}
                                        placeholder="At least 6 characters"
                                        autoComplete="new-password"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-2"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-slate-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e)}
                                        placeholder="Re-enter password"
                                        autoComplete="new-password"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-2"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold shadow-glow hover:shadow-glow-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner w-5 h-5 border-2 border-white border-t-transparent" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-[#0a0f1c] text-slate-500">Or sign up with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignUp}
                                className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors shadow-lg"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign up with Google
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            Already have an account?{' '}
                            <a href="/login" className="text-primary-light hover:text-primary transition-colors font-medium">
                                Sign in
                            </a>
                        </p>
                    </div>

                    <div className="mt-4 text-center text-xs text-slate-500">
                        💡 Press <kbd className="px-2 py-1 bg-slate-700/50 rounded text-slate-400">Enter</kbd> to navigate between fields
                    </div>
                </SlideUp>
            </div>

            {/* Welcome Tour Modal */}
            <WelcomeTour
                isOpen={showTour}
                onClose={() => {
                    setShowTour(false);
                    router.push('/home');
                }}
            />
        </div>
    );
}

export default function Signup() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
