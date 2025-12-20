'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Test {
    id: string;
    title: string;
    subject: string;
    difficulty: string;
    time_limit: number;
}

interface Question {
    id: string;
    question_type: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    points: number;
}

export default function TakeTestPage() {
    const params = useParams();
    const router = useRouter();
    const testId = params.id as string;

    const [test, setTest] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        fetchTest();
    }, [testId]);

    useEffect(() => {
        if (timeLeft > 0 && !submitted) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !submitted && questions.length > 0) {
            handleSubmit();
        }
    }, [timeLeft, submitted]);

    const fetchTest = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch test
            const { data: testData, error: testError } = await supabase
                .from('practice_tests')
                .select('*')
                .eq('id', testId)
                .single();

            if (testError) throw testError;
            setTest(testData);
            setTimeLeft(testData.time_limit * 60); // Convert to seconds

            // Fetch questions
            const { data: questionsData, error: questionsError } = await supabase
                .from('test_questions')
                .select('*')
                .eq('test_id', testId)
                .order('created_at', { ascending: true });

            if (questionsError) throw questionsError;
            setQuestions(questionsData || []);
        } catch (error: any) {
            toast.error('Failed to load test');
            router.push('/exam-prep/tests');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Calculate score
        let correctCount = 0;
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach((q) => {
            totalPoints += q.points;
            if (answers[q.id] === q.correct_answer) {
                correctCount++;
                earnedPoints += q.points;
            }
        });

        const percentage = (earnedPoints / totalPoints) * 100;
        setScore(percentage);
        setSubmitted(true);

        // Save attempt to database
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_test_attempts').insert({
                    user_id: user.id,
                    test_id: testId,
                    score: percentage,
                    answers: answers
                });

                // Award points based on performance
                const { awardPoints } = await import('@/lib/gamification');
                let points = 0;
                if (percentage >= 80) {
                    points = await awardPoints(user.id, 'challengeWon');
                    toast.success(`🏆 Ace! +${points} XP`);
                } else if (percentage >= 50) {
                    points = await awardPoints(user.id, 'goalCompleted');
                    toast.success(`👍 Passed! +${points} XP`);
                }
            }
        } catch (error) {
            console.error('Failed to save test attempt:', error);
        }

        toast.success(`Test submitted! Score: ${percentage.toFixed(1)}%`);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-green-400 bg-green-600/20';
            case 'medium': return 'text-yellow-400 bg-yellow-600/20';
            case 'hard': return 'text-red-400 bg-red-600/20';
            default: return 'text-slate-400 bg-slate-600/20';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!test || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Test not found</h2>
                    <button onClick={() => router.push('/exam-prep/tests')} className="text-pink-400 hover:underline">
                        Back to Tests
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {!submitted ? (
                    <>
                        {/* Header */}
                        <div className="glass-strong rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => router.push('/exam-prep/tests')}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                    Exit Test
                                </button>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm capitalize ${getDifficultyColor(test.difficulty)}`}>
                                        {test.difficulty}
                                    </span>
                                    <div className="flex items-center gap-2 text-white">
                                        <Clock size={20} />
                                        <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-white">{test.title}</h1>
                            <div className="mt-4 bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-pink-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-400 mt-2">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </p>
                        </div>

                        {/* Question */}
                        <div className="glass-strong rounded-2xl p-8 mb-6">
                            <h2 className="text-xl font-bold text-white mb-6">
                                {currentQuestion.question_text}
                            </h2>

                            <div className="space-y-3">
                                {currentQuestion.options?.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setAnswers({ ...answers, [currentQuestion.id]: option })}
                                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${answers[currentQuestion.id] === option
                                            ? 'bg-pink-600/20 border-pink-500 text-white'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                                Previous
                            </button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all font-medium"
                                >
                                    Submit Test
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                                    className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all flex items-center gap-2"
                                >
                                    Next
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    /* Results */
                    <div className="glass-strong rounded-2xl p-8 text-center">
                        <div className={`text-6xl mb-4 ${score >= 70 ? '😊' : score >= 50 ? '😐' : '😔'}`}>
                            {score >= 70 ? '🎉' : score >= 50 ? '📚' : '💪'}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Test Complete!</h2>
                        <p className="text-5xl font-bold text-pink-400 mb-6">{score.toFixed(1)}%</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="glass-strong rounded-xl p-4">
                                <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                                    <CheckCircle2 size={24} />
                                    <span className="text-2xl font-bold">
                                        {Object.values(answers).filter((ans, idx) => ans === questions[idx]?.correct_answer).length}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm">Correct</p>
                            </div>
                            <div className="glass-strong rounded-xl p-4">
                                <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                                    <XCircle size={24} />
                                    <span className="text-2xl font-bold">
                                        {questions.length - Object.values(answers).filter((ans, idx) => ans === questions[idx]?.correct_answer).length}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm">Incorrect</p>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => router.push('/exam-prep/tests')}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            >
                                Back to Tests
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all"
                            >
                                Retake Test
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
