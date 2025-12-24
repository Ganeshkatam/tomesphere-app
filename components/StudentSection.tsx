'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess, showWarning } from '@/lib/toast';
import { useState, useEffect } from 'react';
import StudentVerificationModal from './StudentVerificationModal';

export default function StudentSection() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [studentStatus, setStudentStatus] = useState<'not_verified' | 'pending' | 'verified'>('not_verified');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user);
            if (session?.user) {
                checkStudentStatus(session.user.id);
            }
        });
    }, []);

    const checkStudentStatus = async (userId: string) => {
        const { data, error } = await supabase
            .from('student_profiles')
            .select('verification_status')
            .eq('user_id', userId)
            .single();

        if (data) {
            setStudentStatus(data.verification_status as any);
        }
    };

    const handleVerifyStudent = () => {
        if (!user) {
            showError('Please sign in to verify student status');
            router.push('/signup');
            return;
        }

        if (studentStatus === 'verified') {
            showSuccess('You are already verified as a student!');
            return;
        }

        if (studentStatus === 'pending') {
            showWarning('Your verification is pending review');
            return;
        }

        setIsVerificationModalOpen(true);
    };

    const handleSubjectClick = (subject: string) => {
        const genreName = subject.split(' ').slice(1).join(' '); // Remove emoji
        router.push(`/explore?genre=${encodeURIComponent(genreName)}`);
    };
    return (
        <section id="student-section" className="py-12 sm:py-16 relative bg-gradient-to-br from-indigo-950/50 to-purple-950/50">
            <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/20 border border-indigo-500/30 mb-6">
                        <span className="text-2xl">🎓</span>
                        <span className="text-sm font-semibold text-indigo-300">For Students</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
                        <span className="text-white">Your </span>
                        <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Academic Success
                        </span>
                        <span className="text-white"> Partner</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Access textbooks, organize study materials, collaborate with classmates, and ace your exams.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {/* Academic Library */}
                    <div
                        onClick={() => router.push('/academic')}
                        className="glass-strong rounded-2xl p-4 border border-white/10 hover:border-green-500/30 transition-all group cursor-pointer"
                    >                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                            Academic Library
                        </h3>
                        <p className="text-slate-400 mb-4 text-sm">
                            Access thousands of textbooks, reference materials, and research papers organized by subject and course.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Subject-wise categorization</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Latest editions available</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Quick reference guides</span>
                            </li>
                        </ul>
                    </div>

                    {/* Study Groups */}
                    <div
                        onClick={() => router.push('/study-groups')}
                        className="glass-strong rounded-2xl p-4 border border-white/10 hover:border-blue-500/30 transition-all group cursor-pointer">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                            Study Groups
                        </h3>
                        <p className="text-slate-400 mb-4 text-sm">
                            Join course-specific study groups, collaborate on assignments, and prepare for exams together.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-400">✓</span>
                                <span>Course-based groups</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-400">✓</span>
                                <span>Share study materials</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-400">✓</span>
                                <span>Group study sessions</span>
                            </li>
                        </ul>
                    </div>

                    {/* Notes & Highlights */}
                    <div
                        onClick={() => router.push('/notes')}
                        className="glass-strong rounded-2xl p-4 border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer">
                        <div className="text-4xl mb-4">✍️</div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                            Smart Notes
                        </h3>
                        <p className="text-slate-400 mb-4 text-sm">
                            Take notes, highlight important sections, and organize your study materials efficiently.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="text-purple-400">✓</span>
                                <span>Highlight & annotate</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-400">✓</span>
                                <span>Cloud sync everywhere</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-400">✓</span>
                                <span>Export as PDF/Word</span>
                            </li>
                        </ul>
                    </div>

                    {/* Citation Generator */}
                    <div
                        onClick={() => router.push('/citations')}
                        className="glass-strong rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all group cursor-pointer">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                            Citation Generator
                        </h3>
                        <p className="text-slate-400 mb-4 text-sm">
                            Automatically generate citations in APA, MLA, Chicago, and Harvard formats for your research papers.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="text-orange-400">✓</span>
                                <span>Multiple citation styles</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-orange-400">✓</span>
                                <span>Bibliography builder</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-orange-400">✓</span>
                                <span>Export citations</span>
                            </li>
                        </ul>
                    </div>

                    {/* Textbook Exchange */}
                    <div
                        onClick={() => router.push('/textbook-exchange')}
                        className="glass-strong rounded-2xl p-4 border border-white/10 hover:border-yellow-500/30 transition-all group cursor-pointer">
                        <div className="text-4xl mb-4">🔄</div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                            Textbook Exchange
                        </h3>
                        <p className="text-slate-400 mb-4 text-sm">
                            Buy, sell, or exchange textbooks with fellow students. Save money on expensive course materials.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-400">✓</span>
                                <span>Buy/sell used books</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-400">✓</span>
                                <span>Semester exchange program</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-400">✓</span>
                                <span>Price comparison</span>
                            </li>
                        </ul>
                    </div>

                    {/* Exam Prep */}
                    <div className="glass-strong rounded-2xl p-4 border border-white/10 hover:border-red-500/30 transition-all group">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
                            Exam Preparation
                        </h3>
                        <p className="text-slate-400 mb-4 text-sm">
                            Practice tests, flashcards, and study guides to help you ace your exams and improve grades.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✓</span>
                                <span>Practice question banks</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✓</span>
                                <span>AI-powered flashcards</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✓</span>
                                <span>Mock exam simulator</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Student Benefits Banner */}
                <div className="glass-strong rounded-2xl p-8 border-2 border-green-500/30 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                🎓 Student Discount Available
                            </h3>
                            <p className="text-slate-300 mb-2">
                                Get <span className="text-green-400 font-bold">50% off</span> on premium features with your .edu email address!
                            </p>
                            <ul className="text-sm text-slate-400 space-y-1">
                                <li>✓ Unlimited textbook access</li>
                                <li>✓ Advanced note-taking tools</li>
                                <li>✓ Priority study group matching</li>
                            </ul>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={handleVerifyStudent}
                                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-green-500/50"
                            >
                                Verify Student Status →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Popular Subjects Quick Links */}
                <div className="mt-12">
                    <h3 className="text-center text-lg font-semibold text-white mb-6">Popular Study Areas</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            '📐 Mathematics',
                            '🔬 Science',
                            '💻 Computer Science',
                            '⚖️ Law',
                            '🏥 Medicine',
                            '💼 Business',
                            '🎨 Arts',
                            '🌍 History',
                            '📊 Economics',
                            '🧪 Chemistry',
                            '🔭 Physics',
                            '🧬 Biology'
                        ].map((subject) => (
                            <button
                                key={subject}
                                onClick={() => handleSubjectClick(subject)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-lg text-sm text-white transition-all"
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Verification Modal */}
            {user && (
                <StudentVerificationModal
                    isOpen={isVerificationModalOpen}
                    onClose={() => setIsVerificationModalOpen(false)}
                    onVerified={() => {
                        setIsVerificationModalOpen(false);
                        if (user) checkStudentStatus(user.id);
                    }}
                />
            )}
        </section>
    );
}
