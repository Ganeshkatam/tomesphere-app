'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isListening?: boolean;
    className?: string;
}

export default function VoiceInput({ onTranscript, isListening: externalListening, className = '' }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // Check if browser supports speech recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = true;
                recognitionInstance.interimResults = true;
                recognitionInstance.lang = 'en-US';

                recognitionInstance.onresult = (event: any) => {
                    const transcript = Array.from(event.results)
                        .map((result: any) => result[0])
                        .map((result: any) => result.transcript)
                        .join('');

                    onTranscript(transcript);
                };

                recognitionInstance.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    if (event.error === 'no-speech') {
                        toast.error('No speech detected. Please try again.');
                    } else if (event.error === 'not-allowed') {
                        toast.error('Microphone access denied. Please enable it in your browser settings.');
                    } else {
                        toast.error('Voice recognition error. Please try again.');
                    }
                    setIsListening(false);
                };

                recognitionInstance.onend = () => {
                    if (isListening) {
                        recognitionInstance.start();
                    }
                };

                setRecognition(recognitionInstance);
            }
        }

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (externalListening !== undefined) {
            if (externalListening && !isListening) {
                startListening();
            } else if (!externalListening && isListening) {
                stopListening();
            }
        }
    }, [externalListening]);

    const startListening = () => {
        if (!recognition) {
            toast.error('Voice recognition not supported in your browser');
            return;
        }

        try {
            recognition.start();
            setIsListening(true);
            toast.success('Listening...');
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    };

    const stopListening = () => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-all ${isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white'
                } ${className}`}
            title={isListening ? 'Stop recording' : 'Start voice input'}
        >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
    );
}

// Hook for using voice input in components
export function useVoiceInput(onTranscript: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);

    return {
        isListening,
        startListening: () => setIsListening(true),
        stopListening: () => setIsListening(false),
        VoiceButton: () => (
            <VoiceInput
                onTranscript={onTranscript}
                isListening={isListening}
            />
        )
    };
}
