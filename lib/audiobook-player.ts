export interface AudioBook {
    id: string;
    bookId: string;
    title: string;
    author: string;
    narrator: string;
    duration: number; // in seconds
    audioUrl: string;
    chapters: AudioChapter[];
}

export interface AudioChapter {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    duration: number;
}

export interface AudioPlaybackState {
    bookId: string;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    playbackRate: number;
    currentChapter?: number;
}

export class AudioBookPlayer {
    private audio: HTMLAudioElement | null = null;
    private state: AudioPlaybackState;

    constructor() {
        this.state = {
            bookId: '',
            currentTime: 0,
            duration: 0,
            isPlaying: false,
            volume: 1.0,
            playbackRate: 1.0,
        };
    }

    async loadAudioBook(audioBook: AudioBook): Promise<void> {
        if (this.audio) {
            this.audio.pause();
        }

        this.audio = new Audio(audioBook.audioUrl);
        this.state.bookId = audioBook.id;
        this.state.duration = audioBook.duration;

        // Load saved progress
        const savedProgress = this.getSavedProgress(audioBook.id);
        if (savedProgress) {
            this.audio.currentTime = savedProgress.currentTime;
            this.state.currentTime = savedProgress.currentTime;
        }

        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.audio) return;

        this.audio.addEventListener('timeupdate', () => {
            if (this.audio) {
                this.state.currentTime = this.audio.currentTime;
                this.saveProgress();
            }
        });

        this.audio.addEventListener('ended', () => {
            this.state.isPlaying = false;
        });

        this.audio.addEventListener('play', () => {
            this.state.isPlaying = true;
        });

        this.audio.addEventListener('pause', () => {
            this.state.isPlaying = false;
        });
    }

    play(): void {
        this.audio?.play();
    }

    pause(): void {
        this.audio?.pause();
    }

    seek(time: number): void {
        if (this.audio) {
            this.audio.currentTime = time;
            this.state.currentTime = time;
        }
    }

    setVolume(volume: number): void {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
            this.state.volume = this.audio.volume;
        }
    }

    setPlaybackRate(rate: number): void {
        if (this.audio) {
            this.audio.playbackRate = rate;
            this.state.playbackRate = rate;
        }
    }

    skipForward(seconds: number = 30): void {
        this.seek(this.state.currentTime + seconds);
    }

    skipBackward(seconds: number = 30): void {
        this.seek(Math.max(0, this.state.currentTime - seconds));
    }

    goToChapter(chapterIndex: number, chapters: AudioChapter[]): void {
        if (chapters[chapterIndex]) {
            this.seek(chapters[chapterIndex].startTime);
            this.state.currentChapter = chapterIndex;
        }
    }

    getState(): AudioPlaybackState {
        return { ...this.state };
    }

    private saveProgress(): void {
        const progress = {
            bookId: this.state.bookId,
            currentTime: this.state.currentTime,
            lastPlayed: new Date().toISOString(),
        };
        localStorage.setItem(`audiobook-progress-${this.state.bookId}`, JSON.stringify(progress));
    }

    private getSavedProgress(bookId: string): { currentTime: number } | null {
        const saved = localStorage.getItem(`audiobook-progress-${bookId}`);
        return saved ? JSON.parse(saved) : null;
    }

    formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    getProgress(): number {
        if (this.state.duration === 0) return 0;
        return (this.state.currentTime / this.state.duration) * 100;
    }
}

export const audioPlayer = new AudioBookPlayer();
