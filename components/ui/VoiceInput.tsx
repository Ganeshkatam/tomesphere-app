'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    className?: string;
    isListening?: boolean;
    onStateChange?: (isListening: boolean) => void;
    placeholder?: string;
}

export default function VoiceInput({
    onTranscript,
    className = '',
    isListening: externalIsListening,
    onStateChange
}: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setIsSupported(false);
            }
        }
    }, []);

    useEffect(() => {
        if (externalIsListening !== undefined && externalIsListening !== isListening) {
            if (externalIsListening) {
                startListening();
            } else {
                stopListening();
            }
        }
    }, [externalIsListening]);

    const startListening = () => {
        if (!isSupported) {
            toast.error('Voice input is not supported in this browser.');
            return;
        }

        if (isListening) return;

        try {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                onStateChange?.(true);
            };

            recognition.onend = () => {
                setIsListening(false);
                onStateChange?.(false);
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Pass the interim or final text back
                // If we want real-time streaming updates, we send interim too
                // But usually for search inputs, we might just want to append
                // For now, let's send the latest detected segment
                const transcript = finalTranscript || interimTranscript;
                if (transcript) {
                    onTranscript(transcript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied.');
                }
                stopListening();
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        onStateChange?.(false);
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (!isSupported) return null;

    return (
        <button
            onClick={toggleListening}
            type="button"
            className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center ${isListening
                    ? 'bg-red-500/20 text-red-500 animate-pulse shadow-lg shadow-red-500/20 ring-2 ring-red-500/50'
                    : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                } ${className}`}
            title={isListening ? "Stop listening" : "Start voice search"}
        >
            {isListening ? (
                <MicOff size={20} />
            ) : (
                <Mic size={20} />
            )}
        </button>
    );
}
