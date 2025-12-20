export interface ReadingProgress {
    bookId: string;
    userId: string;
    currentPage: number;
    totalPages: number;
    currentChapter?: string;
    scrollPosition?: number;
    lastSynced: string;
    deviceId: string;
}

export class ProgressSyncManager {
    private syncInterval: number = 30000; // 30 seconds
    private syncTimer: any = null;

    async syncProgress(progress: ReadingProgress): Promise<boolean> {
        // Save to localStorage immediately
        this.saveLocal(progress);

        // Sync to cloud (would use Supabase in production)
        try {
            await this.syncToCloud(progress);
            return true;
        } catch (error) {
            console.error('Failed to sync progress:', error);
            return false;
        }
    }

    private saveLocal(progress: ReadingProgress): void {
        const key = `progress-${progress.userId}-${progress.bookId}`;
        localStorage.setItem(key, JSON.stringify(progress));
    }

    getLocalProgress(userId: string, bookId: string): ReadingProgress | null {
        const key = `progress-${userId}-${bookId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    }

    private async syncToCloud(progress: ReadingProgress): Promise<void> {
        // In production, this would call Supabase
        // await supabase.from('reading_progress').upsert(progress)

        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }

    startAutoSync(userId: string, bookId: string, getCurrentProgress: () => ReadingProgress): void {
        this.stopAutoSync();

        this.syncTimer = setInterval(async () => {
            const progress = getCurrentProgress();
            await this.syncProgress(progress);
        }, this.syncInterval);
    }

    stopAutoSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    async getProgressFromAllDevices(userId: string, bookId: string): Promise<ReadingProgress[]> {
        // Fetch from cloud - would query all progress records for this user+book
        // This allows seeing progress across all devices

        const localProgress = this.getLocalProgress(userId, bookId);
        return localProgress ? [localProgress] : [];
    }

    async resolveConflict(progresses: ReadingProgress[]): Promise<ReadingProgress> {
        // Return the most recent progress
        return progresses.reduce((latest, current) =>
            new Date(current.lastSynced) > new Date(latest.lastSynced) ? current : latest
        );
    }

    calculateProgress(currentPage: number, totalPages: number): number {
        if (totalPages === 0) return 0;
        return Math.round((currentPage / totalPages) * 100);
    }

    estimateTimeRemaining(
        currentPage: number,
        totalPages: number,
        averagePageTime: number = 2 // minutes per page
    ): number {
        const pagesLeft = totalPages - currentPage;
        return pagesLeft * averagePageTime;
    }

    formatTimeRemaining(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
}

export const progressSync = new ProgressSyncManager();
