'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, BookOpen, Search, Heart, Star, Users, Award, Zap } from 'lucide-react';

interface TourStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    tips?: string[];
}

interface WelcomeTourProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WelcomeTour({ isOpen, onClose }: WelcomeTourProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const tourSteps: TourStep[] = [
        {
            title: "Welcome to TomeSphere! 🎉",
            description: "Your ultimate book discovery and learning platform. Let's take a quick tour to get you started!",
            icon: <BookOpen size={48} className="text-indigo-400" />,
            tips: [
                "This tour takes just 2 minutes",
                "You can skip or revisit anytime",
                "Let's discover what you can do!"
            ]
        },
        {
            title: "Discover Amazing Books 📚",
            description: "Browse thousands of books with smart search and filters.",
            icon: <Search size={48} className="text-purple-400" />,
            tips: [
                "Use voice input 🎤 for faster search",
                "Filter by genre, author, or rating",
                "Save books to your personal library",
                "Get AI-powered recommendations"
            ]
        },
        {
            title: "Read Anywhere, Anytime 📖",
            description: "Enjoy books in our beautiful e-reader with customizable settings.",
            icon: <Zap size={48} className="text-yellow-400" />,
            tips: [
                "Dark/Light mode for comfortable reading",
                "Adjust font size and style",
                "Text-to-speech narration",
                "Auto-save progress & bookmarks",
                "Works offline with PWA!"
            ]
        },
        {
            title: "Build Your Library ❤️",
            description: "Like, rate, and organize your favorite books.",
            icon: <Heart size={48} className="text-red-400" />,
            tips: [
                "Like books to save them",
                "Rate books (1-5 stars)",
                "Create custom collections",
                "Track your reading progress"
            ]
        },
        {
            title: "Study & Learn Together 👥",
            description: "Join study groups, create notes, and prepare for exams.",
            icon: <Users size={48} className="text-green-400" />,
            tips: [
                "Join topic-based study groups",
                "Create & share notes",
                "Make flashcards for exam prep",
                "Generate citations in MLA/APA",
                "Exchange textbooks with peers"
            ]
        },
        {
            title: "Get Student Benefits 🎓",
            description: "Verify your student status for exclusive perks!",
            icon: <Award size={48} className="text-orange-400" />,
            tips: [
                "Upload student ID for verification",
                "Get verified badge on profile",
                "Access exclusive content",
                "Enjoy student discounts",
                "Priority support"
            ]
        },
        {
            title: "You're All Set! 🚀",
            description: "Start exploring and happy reading!",
            icon: <Check size={48} className="text-green-400" />,
            tips: [
                "Visit /explore to browse books",
                "Set your reading goals in /profile",
                "Install the app for offline access",
                "Join the community in /study-groups",
                "Need help? Check /help anytime"
            ]
        }
    ];

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeTour = () => {
        localStorage.setItem('tour-completed', 'true');
        onClose();
    };

    const skipTour = () => {
        localStorage.setItem('tour-skipped', 'true');
        onClose();
    };

    if (!isOpen) return null;

    const step = tourSteps[currentStep];
    const progress = ((currentStep + 1) / tourSteps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-slideIn">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Close & Skip Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {currentStep === 0 && (
                        <button
                            onClick={skipTour}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Skip Tour
                        </button>
                    )}
                    <button
                        onClick={completeTour}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 pt-16">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            {step.icon}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-lg text-slate-300 text-center mb-8 max-w-lg mx-auto">
                        {step.description}
                    </p>

                    {/* Tips */}
                    {step.tips && (
                        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                            <h3 className="text-sm font-semibold text-indigo-400 mb-3 uppercase tracking-wider">
                                {currentStep === 0 ? "What to Expect:" : currentStep === tourSteps.length - 1 ? "Quick Links:" : "Key Features:"}
                            </h3>
                            <ul className="space-y-2">
                                {step.tips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-3 text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                        <span className="text-sm">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Step Indicator */}
                    <div className="flex justify-center gap-2 mb-8">
                        {tourSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`transition-all ${index === currentStep
                                        ? 'w-8 h-2 bg-indigo-600'
                                        : index < currentStep
                                            ? 'w-2 h-2 bg-green-500'
                                            : 'w-2 h-2 bg-white/20'
                                    } rounded-full`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${currentStep === 0
                                    ? 'opacity-0 pointer-events-none'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                        >
                            <ChevronLeft size={20} />
                            <span>Previous</span>
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <span>{currentStep === tourSteps.length - 1 ? "Get Started!" : "Next"}</span>
                            {currentStep === tourSteps.length - 1 ? <Check size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
