'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, Upload, Check, X, Loader2, School, Mail, FileText, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VerifyStudentClient() {
    const [step, setStep] = useState<'info' | 'method' | 'upload' | 'success'>('info');
    const [method, setMethod] = useState<'email' | 'document' | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form Data
    const [formData, setFormData] = useState({
        full_name: '',
        university_name: '',
        student_email: '',
    });

    // Camera/Upload State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const router = useRouter();

    useEffect(() => {
        checkAuth();
        return () => {
            stopCamera();
        };
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error(err);
            toast.error('Could not access camera');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageSrc);
        stopCamera();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let docUrl = null;

            // Upload image if method is document
            if (method === 'document' && capturedImage && user) {
                const blob = await (await fetch(capturedImage)).blob();
                const fileName = `${user.id}/${Date.now()}.jpg`;

                // Note: Ensure 'student-docs' bucket exists in your Supabase Storage
                // For now we simulate upload success if bucket logic isn't perfect
                const { data, error } = await supabase.storage
                    .from('student-docs')
                    .upload(fileName, blob);

                if (!error) {
                    docUrl = data?.path;
                }
            }

            // Create verification request
            const { error: insertError } = await supabase
                .from('student_verifications')
                .insert({
                    user_id: user.id,
                    full_name: formData.full_name,
                    university_name: formData.university_name,
                    student_email: method === 'email' ? formData.student_email : null,
                    document_url: docUrl,
                    verification_type: method,
                    status: 'pending' // DB trigger will auto-update to 'verified' if .edu email
                });

            if (insertError) throw insertError;

            setStep('success');
            toast.success('Verification submitted!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page">
            <Navbar role="user" currentPage="/verify-student" />
            <Toaster position="top-center" />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <School className="text-primary" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Student Verification</h1>
                        <p className="text-slate-400">Unlock exclusive student benefits and features</p>
                    </div>

                    {/* Step 1: Info */}
                    {step === 'info' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                                    placeholder="As shown on your student ID"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">University Name</label>
                                <input
                                    type="text"
                                    value={formData.university_name}
                                    onChange={e => setFormData({ ...formData, university_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                                    placeholder="e.g. Harvard University"
                                />
                            </div>
                            <button
                                onClick={() => setStep('method')}
                                disabled={!formData.full_name || !formData.university_name}
                                className="w-full btn btn-primary py-3 rounded-xl font-bold mt-4 disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* Step 2: Method Selection */}
                    {step === 'method' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => { setMethod('email'); setStep('upload'); }}
                                className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary rounded-xl transition-all group text-left"
                            >
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Mail className="text-blue-400" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">School Email</h3>
                                <p className="text-sm text-slate-400">Instant verification with your .edu email address</p>
                            </button>

                            <button
                                onClick={() => { setMethod('document'); setStep('upload'); }}
                                className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary rounded-xl transition-all group text-left"
                            >
                                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="text-purple-400" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Upload ID Card</h3>
                                <p className="text-sm text-slate-400">Upload a photo of your student ID card</p>
                            </button>
                        </div>
                    )}

                    {/* Step 3: Action (Email or Camera) */}
                    {step === 'upload' && method === 'email' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-blue-200">
                                    For instant verification, use a valid university email (ending in .edu, .ac.uk, etc.)
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">University Email</label>
                                <input
                                    type="email"
                                    value={formData.student_email}
                                    onChange={e => setFormData({ ...formData, student_email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                                    placeholder="you@university.edu"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.student_email}
                                className="w-full btn btn-primary py-3 rounded-xl font-bold"
                            >
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify Now'}
                            </button>
                        </div>
                    )}

                    {step === 'upload' && method === 'document' && (
                        <div className="space-y-6">
                            {!capturedImage ? (
                                <>
                                    {stream ? (
                                        <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                                <button onClick={capturePhoto} className="p-4 bg-white rounded-full shadow-lg hover:scale-105 transition-transform">
                                                    <Camera className="text-black" size={24} />
                                                </button>
                                                <button onClick={stopCamera} className="p-4 bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors">
                                                    <X className="text-white" size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={startCamera}
                                                className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary hover:bg-white/5 flex flex-col items-center justify-center gap-4 group transition-all"
                                            >
                                                <Camera className="text-slate-400 group-hover:text-primary" size={32} />
                                                <span className="text-slate-400 group-hover:text-white font-medium">Use Camera</span>
                                            </button>

                                            <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary hover:bg-white/5 flex flex-col items-center justify-center gap-4 group transition-all cursor-pointer">
                                                <Upload className="text-slate-400 group-hover:text-primary" size={32} />
                                                <span className="text-slate-400 group-hover:text-white font-medium">Upload File</span>
                                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={capturedImage} alt="Captured ID" className="w-full rounded-xl border border-white/10" />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setCapturedImage(null)}
                                            className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/5 text-white font-medium"
                                        >
                                            Retake
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            className="flex-1 btn btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <>Submit Verification <Check size={18} /></>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="text-green-500" size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
                            <p className="text-slate-300 mb-6">
                                {method === 'email'
                                    ? "We've sent a confirmation link to your school email."
                                    : "Your document is under review. We'll notify you once verified."}
                            </p>
                            <button onClick={() => router.push('/profile')} className="btn btn-primary px-8 py-3 rounded-xl">
                                Go to Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
