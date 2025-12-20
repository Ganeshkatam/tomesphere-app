export class ReadingTimer {
    private startTime: number = 0;
    private elapsed: number = 0;
    private isRunning: boolean = false;
    private timer: any = null;

    start(): void {
        if (this.isRunning) return;

        this.startTime = Date.now() - this.elapsed;
        this.isRunning = true;

        this.timer = setInterval(() => {
            this.elapsed = Date.now() - this.startTime;
        }, 100);
    }

    pause(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    reset(): void {
        this.pause();
        this.elapsed = 0;
        this.startTime = 0;
    }

    getElapsed(): number {
        return this.isRunning ? Date.now() - this.startTime : this.elapsed;
    }

    getFormattedTime(): string {
        const ms = this.getElapsed();
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const s = seconds % 60;
        const m = minutes % 60;

        if (hours > 0) {
            return `${hours}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    saveSession(userId: string, bookId: string): void {
        const duration = this.getElapsed();
        const sessions = this.getSessions(userId, bookId);

        sessions.push({
            date: new Date().toISOString(),
            duration,
        });

        localStorage.setItem(`reading-sessions-${userId}-${bookId}`, JSON.stringify(sessions));
    }

    getSessions(userId: string, bookId: string): Array<{ date: string; duration: number }> {
        const stored = localStorage.getItem(`reading-sessions-${userId}-${bookId}`);
        return stored ? JSON.parse(stored) : [];
    }

    getTotalTime(userId: string, bookId: string): number {
        const sessions = this.getSessions(userId, bookId);
        return sessions.reduce((total, session) => total + session.duration, 0);
    }

    getFormattedTotal(userId: string, bookId: string): string {
        const ms = this.getTotalTime(userId, bookId);
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }
}

export const readingTimer = new ReadingTimer();
