import { supabase } from './supabase';

export interface ReadingStatistics {
    userId: string;
    timeframe: 'week' | 'month' | 'year' | 'all';
    stats: {
        booksRead: number;
        pagesRead: number;
        averagePagesPerDay: number;
        readingTimeMinutes: number;
        fastestBook: { title: string; days: number };
        longestBook: { title: string; pages: number };
        genreDistribution: { genre: string; count: number; percentage: number }[];
        authorDistribution: { author: string; books: number }[];
        monthlyProgress: { month: string; books: number; pages: number }[];
        readingStreak: number;
        completionRate: number;
    };
}

export async function getAdvancedStatistics(
    userId: string,
    timeframe: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<ReadingStatistics> {
    const startDate = getStartDate(timeframe);

    const { data: books } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId)
        .eq('status', 'finished')
        .gte('finished_at', startDate);

    if (!books || books.length === 0) {
        return getEmptyStats(userId, timeframe);
    }

    const totalPages = books.reduce((sum, b) => sum + (b.books?.pages || 0), 0);
    const daysSinceStart = Math.max(1,
        Math.ceil((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    // Genre distribution
    const genreMap = new Map<string, number>();
    books.forEach(b => {
        const genre = b.books?.genre;
        if (genre) genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    const genreDistribution = Array.from(genreMap.entries())
        .map(([genre, count]) => ({
            genre,
            count,
            percentage: Math.round((count / books.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    // Author distribution
    const authorMap = new Map<string, number>();
    books.forEach(b => {
        const author = b.books?.author;
        if (author) authorMap.set(author, (authorMap.get(author) || 0) + 1);
    });

    const authorDistribution = Array.from(authorMap.entries())
        .map(([author, count]) => ({ author, books: count }))
        .sort((a, b) => b.books - a.books)
        .slice(0, 10);

    // Find fastest book
    const booksWithDuration = books.map(b => ({
        title: b.books?.title || '',
        days: Math.ceil(
            (new Date(b.finished_at).getTime() - new Date(b.started_at || b.finished_at).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
    })).filter(b => b.days > 0);

    const fastestBook = booksWithDuration.length > 0
        ? booksWithDuration.reduce((min, b) => b.days < min.days ? b : min)
        : { title: 'N/A', days: 0 };

    // Find longest book
    const longestBook = books.reduce(
        (max, b) => (b.books?.pages || 0) > max.pages ? { title: b.books?.title || '', pages: b.books?.pages || 0 } : max,
        { title: 'N/A', pages: 0 }
    );

    return {
        userId,
        timeframe,
        stats: {
            booksRead: books.length,
            pagesRead: totalPages,
            averagePagesPerDay: Math.round(totalPages / daysSinceStart),
            readingTimeMinutes: books.length * 300, // Estimate: 5 hours per book
            fastestBook,
            longestBook,
            genreDistribution,
            authorDistribution,
            monthlyProgress: [], // Would calculate from actual data
            readingStreak: 0, // Would calculate from reading_activity
            completionRate: 85, // Mock data
        },
    };
}

function getStartDate(timeframe: 'week' | 'month' | 'year' | 'all'): string {
    const now = new Date();

    switch (timeframe) {
        case 'week':
            now.setDate(now.getDate() - 7);
            break;
        case 'month':
            now.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            now.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
            return '1970-01-01';
    }

    return now.toISOString();
}

function getEmptyStats(userId: string, timeframe: string): ReadingStatistics {
    return {
        userId,
        timeframe: timeframe as any,
        stats: {
            booksRead: 0,
            pagesRead: 0,
            averagePagesPerDay: 0,
            readingTimeMinutes: 0,
            fastestBook: { title: 'N/A', days: 0 },
            longestBook: { title: 'N/A', pages: 0 },
            genreDistribution: [],
            authorDistribution: [],
            monthlyProgress: [],
            readingStreak: 0,
            completionRate: 0,
        },
    };
}

export function generateReadingReport(stats: ReadingStatistics): string {
    return `
Reading Report - ${stats.timeframe}

📚 Books Completed: ${stats.stats.booksRead}
📖 Pages Read: ${stats.stats.pagesRead.toLocaleString()}
📊 Average: ${stats.stats.averagePagesPerDay} pages/day
⏱️ Reading Time: ${Math.round(stats.stats.readingTimeMinutes / 60)} hours

🏆 Fastest Read: ${stats.stats.fastestBook.title} (${stats.stats.fastestBook.days} days)
📕 Longest Book: ${stats.stats.longestBook.title} (${stats.stats.longestBook.pages} pages)

Top Genres:
${stats.stats.genreDistribution.slice(0, 3).map(g => `  ${g.genre}: ${g.percentage}%`).join('\n')}
  `.trim();
}
