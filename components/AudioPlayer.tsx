'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Clock } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string;
    audiobookId: string;
    onProgressUpdate: (position: number) => void;
}

export default function AudioPlayer({ audioUrl, audiobookId, onProgressUpdate }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1.0);
    const [volume, setVolume] = useState(1.0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            onProgressUpdate(-1); // Signal completion
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        // Save progress every 5 seconds
        const interval = setInterval(() => {
            if (audio.currentTime > 0) {
                onProgressUpdate(audio.currentTime);
            }
        }, 5000);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            clearInterval(interval);
        };
    }, [onProgressUpdate]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    };

    const changeSpeed = () => {
        const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(speed);
        const newSpeed = speeds[(currentIndex + 1) % speeds.length];
        setSpeed(newSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <audio ref={audioRef} src={audioUrl} />

            {/* Progress Bar */}
            <div className="mb-6">
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => {
                        const audio = audioRef.current;
                        if (audio) audio.currentTime = Number(e.target.value);
                    }}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={() => skip(-15)}
                    className="p-3 hover:bg-white/10 rounded-full transition-colors"
                >
                    <SkipBack size={24} />
                </button>

                <button
                    onClick={togglePlay}
                    className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-full transition-all"
                >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>

                <button
                    onClick={() => skip(15)}
                    className="p-3 hover:bg-white/10 rounded-full transition-colors"
                >
                    <SkipForward size={24} />
                </button>
            </div>

            {/* Speed & Volume */}
            <div className="flex items-center justify-between mt-6">
                <button
                    onClick={changeSpeed}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Clock size={16} className="inline mr-2" />
                    {speed}x
                </button>

                <div className="flex items-center gap-2">
                    <Volume2 size={20} />
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={volume}
                        onChange={(e) => {
                            const vol = Number(e.target.value);
                            setVolume(vol);
                            if (audioRef.current) audioRef.current.volume = vol;
                        }}
                        className="w-24"
                    />
                </div>
            </div>
        </div>
    );
}
