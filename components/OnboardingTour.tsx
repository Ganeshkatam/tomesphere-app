'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, BookOpen, Star, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TOUR_STEPS = [
    {
        title: "Welcome to TomeSphere 📚",
        description: "Your ultimate platform for books, audiobooks, and academic resources. Let's take a quick tour!",
        icon: <BookOpen size={48} className="text-indigo-400" />,
        targetId: null // Centered
    },
    {
        title: "Your Dashboard",
        description: "Track your reading stats, level up, and resume your books right from here.",
        icon: <Star size={48} className="text-yellow-400" />,
        targetId: "tour-stats"
    },
    {
        title: "Student Verification 🎓",
        description: "Are you a student? Verify your status in Profile to unlock premium features for free!",
        icon: <Shield size={48} className="text-green-400" />,
        targetId: "tour-profile"
    },
    {
        title: "Download the App 📲",
        description: "Install TomeSphere on your device for the best reading experience offline.",
        icon: <Check size={48} className="text-blue-400" />,
        targetId: "tour-download"
    }
];

export default function OnboardingTour() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    useEffect(() => {
        // Check if tour has been completed
        const hasSeenTour = localStorage.getItem('tomesphere_tour_completed');
        if (!hasSeenTour) {
            // Small delay to allow UI to load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('tomesphere_tour_completed', 'true');
    };

    if (!isVisible) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                />

                {/* Card */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl pointer-events-auto mx-4"
                >
                    <button
                        onClick={handleComplete}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                            {step.icon}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                            <p className="text-slate-400 leading-relaxed">{step.description}</p>
                        </div>

                        <div className="flex items-center gap-2 w-full pt-4">
                            <div className="flex gap-1 mr-auto">
                                {TOUR_STEPS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-indigo-500' : 'w-1.5 bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                                {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight size={18} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
