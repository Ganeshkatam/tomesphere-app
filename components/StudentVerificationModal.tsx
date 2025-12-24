'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';
import { X, Mail, School, CheckCircle, AlertCircle, Upload, Camera, Image as ImageIcon } from 'lucide-react';

interface StudentVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

// Extended list of accepted email domains
const ACCEPTED_EMAIL_DOMAINS = [
    '.edu', '.edu.in', '.ac.in', '.edu.au', '.ac.uk', '.edu.sg', '.edu.my', '.edu.ph',
    'iitb.ac.in', 'iitd.ac.in', 'iitm.ac.in', 'iitkgp.ac.in', 'iisc.ac.in',
    'bits-pilani.ac.in', 'nit.ac.in', 'university', 'college', 'student',
];

const validateEmail = (email: string): { valid: boolean; message: string; isStudent: boolean } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return { valid: false, message: 'Email is required', isStudent: false };
    if (!emailRegex.test(email)) return { valid: false, message: 'Invalid email format', isStudent: false };

    const emailLower = email.toLowerCase();
    const isStudentEmail = ACCEPTED_EMAIL_DOMAINS.some(domain => {
        return domain.startsWith('.') ? emailLower.endsWith(domain) : emailLower.includes(domain);
    });

    if (isStudentEmail) return { valid: true, message: 'Valid student email', isStudent: true };
    return { valid: true, message: 'Regular email - additional verification required', isStudent: false };
};

export default function StudentVerificationModal({ isOpen, onClose, onVerified }: StudentVerificationModalProps) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [verificationMethod, setVerificationMethod] = useState<'email' | 'manual'>('email');
    const [loading, setLoading] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ valid: false, message: '', isStudent: false });

    // ID Upload states
    const [idImage, setIdImage] = useState<File | null>(null);
    const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (email) {
            const validation = validateEmail(email);
            setEmailValidation(validation);
            if (validation.isStudent) {
                setVerificationMethod('email');
            } else if (validation.valid) {
                setVerificationMethod('manual');
            }
        } else {
            setEmailValidation({ valid: false, message: '', isStudent: false });
        }
    }, [email]);

    // Camera functionality
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setShowCamera(true);
            }
        } catch (error) {
            showError('Camera access denied');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);

                canvasRef.current.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], 'student-id-photo.jpg', { type: 'image/jpeg' });
                        setIdImage(file);
                        setIdImagePreview(URL.createObjectURL(blob));
                        stopCamera();
                        showSuccess('Photo captured!');
                    }
                });
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showError('File size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                showError('Please upload an image file');
                return;
            }
            setIdImage(file);
            setIdImagePreview(URL.createObjectURL(file));
            showSuccess('ID uploaded!');
        }
    };

    const uploadToSupabase = async (file: File, userId: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `student-ids/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('verification-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('verification-documents')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!emailValidation.valid) {
            showError('Please enter a valid email');
            return;
        }

        if (!emailValidation.isStudent && (!institutionName || !studentId)) {
            showError('Please provide institution name and student ID');
            return;
        }

        if (!emailValidation.isStudent && !idImage) {
            showError('Please upload your student ID for verification');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showError('Please log in first');
                return;
            }

            let idImageUrl = null;
            if (idImage) {
                idImageUrl = await uploadToSupabase(idImage, user.id);
            }

            const { error } = await supabase.from('student_profiles').upsert({
                user_id: user.id,
                email: email,
                institution_name: institutionName || null,
                student_id: studentId || null,
                id_image_url: idImageUrl,
                verification_status: emailValidation.isStudent ? 'verified' : 'pending',
                verification_method: verificationMethod,
                verified_at: emailValidation.isStudent ? new Date().toISOString() : null
            });

            if (error) throw error;

            if (emailValidation.isStudent) {
                showSuccess('Verified! You now have access to student features.');
                setStep(3);
                setTimeout(() => {
                    onVerified();
                    onClose();
                }, 2000);
            } else {
                showSuccess('Submitted for manual verification. We\'ll review within 24 hours.');
                setStep(3);
                setTimeout(() => onClose(), 3000);
            }
        } catch (error: any) {
            showError('Verification failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-strong rounded-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                {step === 1 && (
                    <div>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <School size={32} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Student Verification</h2>
                            <p className="text-slate-400">Unlock exclusive student features</p>
                        </div>

                        <div className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Email Address *</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@university.edu"
                                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-slate-500 focus:outline-none ${email && emailValidation.valid ? 'border-green-500/50' : email && !emailValidation.valid ? 'border-red-500/50' : 'border-white/10'
                                            }`}
                                    />
                                    {email && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {emailValidation.valid ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}
                                        </div>
                                    )}
                                </div>
                                {email && <p className={`text-xs mt-1 ${emailValidation.valid ? 'text-green-400' : 'text-red-400'}`}>{emailValidation.message}</p>}
                            </div>

                            {/* Additional fields for non-student emails */}
                            {email && emailValidation.valid && !emailValidation.isStudent && (
                                <>
                                    <div className="p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-xl">
                                        <p className="text-sm text-yellow-400">⚠️ Non-institutional email detected. Please provide additional information.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Institution/University Name *</label>
                                        <input
                                            type="text"
                                            value={institutionName}
                                            onChange={(e) => setInstitutionName(e.target.value)}
                                            placeholder="e.g., Stanford University"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Student ID *</label>
                                        <input
                                            type="text"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            placeholder="Your student ID number"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                                        />
                                    </div>

                                    {/* ID Upload Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Student ID Photo/Document *</label>

                                        {!idImagePreview ? (
                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-300 rounded-xl transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Upload size={20} />
                                                        Upload File
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={startCamera}
                                                        className="flex-1 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 text-purple-300 rounded-xl transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Camera size={20} />
                                                        Take Photo
                                                    </button>
                                                </div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                                <p className="text-xs text-slate-500">Upload a clear photo of your student ID card (Max 5MB)</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <img src={idImagePreview} alt="ID Preview" className="w-full h-48 object-cover rounded-xl" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIdImage(null);
                                                        setIdImagePreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Camera View */}
                                        {showCamera && (
                                            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                                                <div className="max-w-lg w-full">
                                                    <video ref={videoRef} autoPlay className="w-full rounded-xl mb-4" />
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={capturePhoto}
                                                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                                                        >
                                                            Capture Photo
                                                        </button>
                                                        <button
                                                            onClick={stopCamera}
                                                            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                </>
                            )}

                            {/* Accepted Domains Info */}
                            <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                                <p className="text-sm text-blue-400 mb-2">✓ Accepted email domains:</p>
                                <p className="text-xs text-slate-400">.edu, .edu.in, .ac.in, .ac.uk, and other institutional domains</p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !emailValidation.valid}
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : emailValidation.isStudent ? 'Verify Student Status' : 'Submit for Review'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {emailValidation.isStudent ? 'Verified!' : 'Submitted!'}
                        </h3>
                        <p className="text-slate-400">
                            {emailValidation.isStudent ? 'You now have access to all student features.' : 'We\'ll review your application within 24 hours.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
