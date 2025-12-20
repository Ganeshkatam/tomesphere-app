'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// Augment window to support webkitSpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
        electronAPI?: {
            runSystemCommand: (command: string) => Promise<boolean>;
            openExternal: (url: string) => Promise<boolean>;
            getPlatform: () => Promise<string>;
        };
    }
}

export default function GakaVoiceListenerWeb() {
    const router = useRouter();
    const [active, setActive] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'talking'>('idle');
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('Listening for "Hey Gaka"...');

    // Refs for optimization (avoiding re-renders during high-frequency speech events)
    const recognitionRef = useRef<any>(null);
    const isProcessingRef = useRef(false);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Optimized Speak Function (Non-blocking with Visuals)
    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;

            utterance.onstart = () => {
                setStatus('talking');
                setFeedback('Speaking...');
            };

            utterance.onend = () => {
                setStatus('idle');
                setFeedback('Listening...');
            };

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    // Optimized Start Listener
    const startRecognition = useCallback(() => {
        try {
            if (recognitionRef.current && status === 'idle') {
                recognitionRef.current.start();
            }
        } catch (e) {
            // Ignore "already started" errors
        }
    }, [status]);

    // Handle command processing
    const handleCommand = useCallback(async (command: string) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        setStatus('processing');
        setFeedback("Processing...");

        // Clean command
        const cleanParams = command.replace("hey gaka", "").replace("hey data", "").trim();

        console.log(`[WebBrain] Intent: ${cleanParams}`);

        // 1. NAVIGATION (Client-Side - Instant)
        if (cleanParams.includes("go to") || cleanParams.includes("open")) {
            if (cleanParams.includes("dashboard") || cleanParams.includes("home")) {
                speak("Opening Dashboard");
                router.push('/home');
            } else if (cleanParams.includes("library") || cleanParams.includes("books")) {
                speak("Opening Library");
                router.push('/academic');
            } else if (cleanParams.includes("notes")) {
                speak("Opening Notes");
                router.push('/notes');
            } else {
                speak("I'm not sure where to go.");
            }
        }
        // 2. QUERY (Supabase - Async)
        else if (cleanParams.includes("search for") || cleanParams.includes("find book")) {
            const query = cleanParams.replace("search for", "").replace("find books about", "").replace("find book", "").trim();
            speak(`Searching for ${query}`);

            const { data, error } = await supabase
                .from('books')
                .select('title')
                .ilike('title', `%${query}%`)
                .limit(1);

            if (data && data.length > 0) {
                speak(`I found ${data[0].title}. Opening details.`);
                toast.success(`Found: ${data[0].title}`);
                // In a real app, router.push to book detail
            } else {
                speak(`I couldn't find any books about ${query}`);
            }
        }
        // 3. SYSTEM
        else if (cleanParams.includes("stop") || cleanParams.includes("cancel") || cleanParams.includes("dismiss")) {
            speak("Okay");
        }
        else {
            // Fallback
            // speak("I didn't catch that command.");
        }

        // Reset
        setTimeout(() => {
            setStatus('idle');
            setFeedback('Listening...');
            setActive(false);
            setTranscript('');
            isProcessingRef.current = false;
        }, 2000);
    }, [router, speak]); // Dependencies

    useEffect(() => {
        if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
            console.warn("Web Speech API not supported.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true; // Essential for "lagless" feedback
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            if (isProcessingRef.current) return;

            const results = event.results;
            const latestResult = results[results.length - 1];
            const text = latestResult[0].transcript.toLowerCase().trim();
            const isFinal = latestResult.isFinal;

            // Instant visual feedback even for interim results
            if (active) setTranscript(text);

            if (status === 'idle') {
                // LIGHTWEIGHT WAKE WORD CHECK
                if (text.includes("hey gaka") || text.includes("hey data")) {
                    triggerWakeWord();
                }
            } else if (status === 'listening') {
                // DEBOUNCED COMMAND CAPTURE
                // If user stops speaking for 1s, or isFinal is true, process it.
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                if (isFinal) {
                    handleCommand(text);
                } else {
                    silenceTimerRef.current = setTimeout(() => {
                        handleCommand(text);
                    }, 1000); // 1s silence threshold
                }
            }
        };

        recognition.onend = () => {
            // Instant restart mechanism
            if (!isProcessingRef.current) {
                setTimeout(() => startRecognition(), 100);
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') setFeedback("Mic denied");
        };

        recognitionRef.current = recognition;
        startRecognition();

        return () => {
            recognition.stop();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [status, active, startRecognition, handleCommand]); // Added handleCommand to deps

    const triggerWakeWord = () => {
        isProcessingRef.current = true;
        setActive(true);
        setStatus('listening');
        setFeedback("I'm listening...");
        // speak("Yes?"); // Optional: Audio acknowledgment

        // Instant unlock for command
        setTimeout(() => {
            isProcessingRef.current = false;
        }, 300);
    };

    if (!active) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl px-6 py-4 rounded-full border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.4)] animate-in slide-in-from-bottom-6 duration-200">
            {/* Optimized Visualizer: CSS only, no JS animation frame overhead */}
            <div className={`relative flex items-center justify-center w-6 h-6`}>
                <div className={`absolute w-full h-full rounded-full transition-colors duration-300 ${status === 'talking' ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'} ${status === 'listening' ? 'animate-ping opacity-75' : ''}`} />
                <div className={`relative w-3 h-3 rounded-full bg-white z-10 ${status === 'processing' ? 'animate-spin border-t-transparent border-2 border-indigo-600' : ''}`} />
            </div>

            <div className="flex flex-col min-w-[150px]">
                <span className="text-white font-bold text-sm tracking-wide">{feedback}</span>
                <span className="text-indigo-300 text-xs truncate max-w-[200px] h-4 block">{transcript}</span>
            </div>

            <button
                onClick={() => {
                    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
                    setActive(false);
                }}
                className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                <span className="sr-only">Close</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M12 2L2 12M2 2l10 10" />
                </svg>
            </button>
        </div>
    );
}
