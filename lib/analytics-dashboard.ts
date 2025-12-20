import { Book } from './supabase';

export interface ReadingAnalyticsDashboard {
    overview: {
        totalBooks: number;
        totalPages: number;
        currentStreak: number;
        longestStreak: number;
        averageRating: number;
    };
    timeAnalysis: {
        readingByMonth: { month: string; books: number; pages: number }[];
        readingByDay: { day: string; minutes: number }[];
        peakReadingHours: number[];
    };
    genreAnalysis: {
        distribution: { genre: string; count: number; percentage: number }[];
        favoriteGenres: string[];
        genreDiversity: number;
    };
    authorAnalysis: {
        topAuthors: { author: string; books: number }[];
        uniqueAuthors: number;
        favoriteAuthor: string;
    };
    readingSpeed: {
        averagePagesPerDay: number;
        averageBookDuration: number;
        fastestBook: { title: string; days: number };
        slowestBook: { title: string; days: number };
    };
    goals: {
        yearlyGoal: number;
        currentProgress: number;
        projectedCompletion: number;
        onTrack: boolean;
    };
    milestones: {
        achieved: string[];
        nextMilestone: string;
        progressToNext: number;
    };
}

export class AnalyticsDashboardGenerator {
    generateDashboard(
        userId: string,
        readingHistory: any[],
        goals: any
    ): ReadingAnalyticsDashboard {
        return {
            overview: this.generateOverview(readingHistory),
            timeAnalysis: this.analyzeTime(readingHistory),
            genreAnalysis: this.analyzeGenres(readingHistory),
            authorAnalysis: this.analyzeAuthors(readingHistory),
            readingSpeed: this.analyzeSpeed(readingHistory),
            goals: this.analyzeGoals(readingHistory, goals),
            milestones: this.analyzeMilestones(readingHistory),
        };
    }

    private generateOverview(history: any[]) {
        const totalBooks = history.length;
        const totalPages = history.reduce((sum, book) => sum + (book.pages || 0), 0);
        const avgRating = history.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks;

        return {
            totalBooks,
            totalPages,
            currentStreak: 0, // Would calculate from reading_activity
            longestStreak: 0,
            averageRating: Math.round(avgRating * 10) / 10,
        };
    }

    private analyzeTime(history: any[]) {
        const monthlyData = new Map<string, { books: number; pages: number }>();

        history.forEach(book => {
            const month = new Date(book.finished_at || book.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
            });

            const current = monthlyData.get(month) || { books: 0, pages: 0 };
            monthlyData.set(month, {
                books: current.books + 1,
                pages: current.pages + (book.pages || 0),
            });
        });

        return {
            readingByMonth: Array.from(monthlyData.entries()).map(([month, data]) => ({
                month,
                ...data,
            })),
            readingByDay: [], // Would calculate from reading_activity
            peakReadingHours: [20, 21, 22], // Mock data
        };
    }

    private analyzeGenres(history: any[]) {
        const genreCount = new Map<string, number>();

        history.forEach(book => {
            genreCount.set(book.genre, (genreCount.get(book.genre) || 0) + 1);
        });

        const distribution = Array.from(genreCount.entries())
            .map(([genre, count]) => ({
                genre,
                count,
                percentage: Math.round((count / history.length) * 100),
            }))
            .sort((a, b) => b.count - a.count);

        return {
            distribution,
            favoriteGenres: distribution.slice(0, 3).map(d => d.genre),
            genreDiversity: genreCount.size,
        };
    }

    private analyzeAuthors(history: any[]) {
        const authorCount = new Map<string, number>();

        history.forEach(book => {
            authorCount.set(book.author, (authorCount.get(book.author) || 0) + 1);
        });

        const topAuthors = Array.from(authorCount.entries())
            .map(([author, books]) => ({ author, books }))
            .sort((a, b) => b.books - a.books);

        return {
            topAuthors: topAuthors.slice(0, 10),
            uniqueAuthors: authorCount.size,
            favoriteAuthor: topAuthors[0]?.author || 'N/A',
        };
    }

    private analyzeSpeed(history: any[]) {
        const booksWithDuration = history.filter(b => b.started_at && b.finished_at);

        const durations = booksWithDuration.map(book => {
            const days = Math.ceil(
                (new Date(book.finished_at).getTime() - new Date(book.started_at).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return { title: book.title, days, pages: book.pages || 0 };
        });

        const avgDuration = durations.reduce((sum, d) => sum + d.days, 0) / durations.length || 0;
        const totalPages = history.reduce((sum, b) => sum + (b.pages || 0), 0);
        const totalDays = durations.reduce((sum, d) => sum + d.days, 0);

        return {
            averagePagesPerDay: Math.round(totalPages / Math.max(totalDays, 1)),
            averageBookDuration: Math.round(avgDuration),
            fastestBook: durations.sort((a, b) => a.days - b.days)[0] || { title: 'N/A', days: 0 },
            slowestBook: durations.sort((a, b) => b.days - a.days)[0] || { title: 'N/A', days: 0 },
        };
    }

    private analyzeGoals(history: any[], goals: any) {
        const yearlyGoal = goals?.yearly || 50;
        const currentProgress = history.filter(b =>
            new Date(b.finished_at).getFullYear() === new Date().getFullYear()
        ).length;

        const daysIntoYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        const daysInYear = 365;
        const projectedCompletion = Math.round((currentProgress / daysIntoYear) * daysInYear);

        return {
            yearlyGoal,
            currentProgress,
            projectedCompletion,
            onTrack: projectedCompletion >= yearlyGoal,
        };
    }

    private analyzeMilestones(history: any[]) {
        const milestones = [10, 25, 50, 100, 250, 500];
        const current = history.length;

        const achieved = milestones.filter(m => current >= m).map(m => `${m} books read`);
        const next = milestones.find(m => current < m);

        return {
            achieved,
            nextMilestone: next ? `${next} books` : 'All milestones achieved!',
            progressToNext: next ? Math.round((current / next) * 100) : 100,
        };
    }
}

export const analyticsGenerator = new AnalyticsDashboardGenerator();
