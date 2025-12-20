export interface ReadingInsight {
    type: 'pattern' | 'milestone' | 'recommendation' | 'trend';
    title: string;
    description: string;
    data?: any;
    icon: string;
}

export class ReadingInsightsEngine {
    generateInsights(userStats: {
        booksRead: Book[];
        readingActivity: any[];
        preferences: string[];
    }): ReadingInsight[] {
        const insights: ReadingInsight[] = [];

        // Reading patterns
        insights.push(...this.detectReadingPatterns(userStats.readingActivity));

        // Genre preferences  
        insights.push(...this.analyzeGenrePreferences(userStats.booksRead));

        // Reading speed
        insights.push(...this.analyzeReadingSpeed(userStats.booksRead));

        // Milestones
        insights.push(...this.detectMilestones(userStats.booksRead));

        // Trends
        insights.push(...this.detectTrends(userStats.booksRead));

        return insights;
    }

    private detectReadingPatterns(activity: any[]): ReadingInsight[] {
        const insights: ReadingInsight[] = [];

        // Find most active reading time
        const hourCounts = new Map<number, number>();
        activity.forEach(a => {
            const hour = new Date(a.timestamp).getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });

        const mostActiveHour = Array.from(hourCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];

        if (mostActiveHour) {
            insights.push({
                type: 'pattern',
                title: 'Peak Reading Time',
                description: `You read most between ${mostActiveHour[0]}:00-${mostActiveHour[0] + 1}:00`,
                data: { hour: mostActiveHour[0], count: mostActiveHour[1] },
                icon: '⏰',
            });
        }

        return insights;
    }

    private analyzeGenrePreferences(books: any[]): ReadingInsight[] {
        const insights: ReadingInsight[] = [];

        const genreCounts = new Map<string, number>();
        books.forEach(book => {
            genreCounts.set(book.genre, (genreCounts.get(book.genre) || 0) + 1);
        });

        const topGenre = Array.from(genreCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];

        if (topGenre && topGenre[1] >= 3) {
            insights.push({
                type: 'pattern',
                title: 'Favorite Genre',
                description: `You love ${topGenre[0]}! You've read ${topGenre[1]} books in this genre.`,
                data: { genre: topGenre[0], count: topGenre[1] },
                icon: '📚',
            });
        }

        return insights;
    }

    private analyzeReadingSpeed(books: any[]): ReadingInsight[] {
        const insights: ReadingInsight[] = [];

        const booksWithDuration = books.filter(b => b.started_at && b.finished_at);
        if (booksWithDuration.length < 3) return insights;

        const avgDays = booksWithDuration.reduce((sum, book) => {
            const days = Math.ceil(
                (new Date(book.finished_at).getTime() - new Date(book.started_at).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
        }, 0) / booksWithDuration.length;

        let speedLabel = 'moderate';
        if (avgDays < 7) speedLabel = 'fast';
        if (avgDays > 21) speedLabel = 'leisurely';

        insights.push({
            type: 'pattern',
            title: 'Reading Pace',
            description: `You're a ${speedLabel} reader, averaging ${Math.round(avgDays)} days per book`,
            data: { averageDays: avgDays, speed: speedLabel },
            icon: '⚡',
        });

        return insights;
    }

    private detectMilestones(books: any[]): ReadingInsight[] {
        const insights: ReadingInsight[] = [];

        const milestones = [10, 25, 50, 100, 250, 500];
        const count = books.length;

        milestones.forEach(milestone => {
            if (count === milestone) {
                insights.push({
                    type: 'milestone',
                    title: `${milestone} Books Read!`,
                    description: `Congratulations! You've reached ${milestone} books!`,
                    data: { milestone },
                    icon: '🏆',
                });
            }
        });

        return insights;
    }

    private detectTrends(books: any[]): ReadingInsight[] {
        const insights: ReadingInsight[] = [];

        // Recent months comparison
        const now = new Date();
        const lastMonth = books.filter(b =>
            new Date(b.finished_at) > new Date(now.getFullYear(), now.getMonth() - 1, 1)
        ).length;

        const previousMonth = books.filter(b => {
            const d = new Date(b.finished_at);
            return d > new Date(now.getFullYear(), now.getMonth() - 2, 1) &&
                d < new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }).length;

        if (lastMonth > previousMonth && lastMonth > 0) {
            const increase = Math.round(((lastMonth - previousMonth) / previousMonth) * 100);
            insights.push({
                type: 'trend',
                title: 'Reading More!',
                description: `You've increased your reading by ${increase}% this month`,
                data: { current: lastMonth, previous: previousMonth, increase },
                icon: '📈',
            });
        }

        return insights;
    }
}

export const insightsEngine = new ReadingInsightsEngine();

interface Book {
    genre: string;
    started_at?: string;
    finished_at?: string;
}
