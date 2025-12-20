import { supabase } from './supabase';

export interface ReadingStats {
    totalBooks: number;
    booksThisYear: number;
    booksThisMonth: number;
    pagesRead: number;
    averageRating: number;
    favoriteGenres: { genre: string; count: number }[];
    readingStreak: number;
    totalReadingTime: number; // in minutes
}

export interface YearInReview {
    year: number;
    totalBooks: number;
    totalPages: number;
    favoriteBook?: {
        title: string;
        author: string;
        rating: number;
    };
    genreBreakdown: { genre: string; count: number; percentage: number }[];
    monthlyReading: { month: string; books: number }[];
    topAuthors: { author: string; books: number }[];
    readingGoalProgress: {
        target: number;
        achieved: number;
        percentage: number;
    };
}

export async function getUserReadingStats(userId: string): Promise<ReadingStats> {
    // Get all user's finished books
    const { data: finishedBooks } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId)
        .eq('status', 'finished');

    if (!finishedBooks || finishedBooks.length === 0) {
        return {
            totalBooks: 0,
            booksThisYear: 0,
            booksThisMonth: 0,
            pagesRead: 0,
            averageRating: 0,
            favoriteGenres: [],
            readingStreak: 0,
            totalReadingTime: 0,
        };
    }

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const booksThisYear = finishedBooks.filter(b =>
        new Date(b.finished_at || b.created_at).getFullYear() === thisYear
    ).length;

    const booksThisMonth = finishedBooks.filter(b => {
        const date = new Date(b.finished_at || b.created_at);
        return date.getFullYear() === thisYear && date.getMonth() === thisMonth;
    }).length;

    const pagesRead = finishedBooks.reduce((sum, b) =>
        sum + (b.books?.pages || 0), 0
    );

    // Get user ratings
    const { data: ratings } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('user_id', userId);

    const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Genre breakdown
    const genreMap = new Map<string, number>();
    finishedBooks.forEach(b => {
        const genre = b.books?.genre;
        if (genre) {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        }
    });

    const favoriteGenres = Array.from(genreMap.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        totalBooks: finishedBooks.length,
        booksThisYear,
        booksThisMonth,
        pagesRead,
        averageRating: Number(averageRating.toFixed(1)),
        favoriteGenres,
        readingStreak: 0, // Would calculate from reading_activity table
        totalReadingTime: finishedBooks.length * 300, // Estimate: 5 hours per book
    };
}

export async function getYearInReview(userId: string, year: number = new Date().getFullYear()): Promise<YearInReview> {
    const { data: yearBooks } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId)
        .eq('status', 'finished')
        .gte('finished_at', `${year}-01-01`)
        .lt('finished_at', `${year + 1}-01-01`);

    if (!yearBooks || yearBooks.length === 0) {
        return {
            year,
            totalBooks: 0,
            totalPages: 0,
            genreBreakdown: [],
            monthlyReading: [],
            topAuthors: [],
            readingGoalProgress: { target: 0, achieved: 0, percentage: 0 },
        };
    }

    const totalPages = yearBooks.reduce((sum, b) => sum + (b.books?.pages || 0), 0);

    // Genre breakdown
    const genreMap = new Map<string, number>();
    yearBooks.forEach(b => {
        const genre = b.books?.genre;
        if (genre) genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    const genreBreakdown = Array.from(genreMap.entries())
        .map(([genre, count]) => ({
            genre,
            count,
            percentage: Math.round((count / yearBooks.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    // Monthly breakdown
    const monthlyMap = new Map<number, number>();
    yearBooks.forEach(b => {
        const month = new Date(b.finished_at).getMonth();
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyReading = monthNames.map((month, i) => ({
        month,
        books: monthlyMap.get(i) || 0,
    }));

    // Top authors
    const authorMap = new Map<string, number>();
    yearBooks.forEach(b => {
        const author = b.books?.author;
        if (author) authorMap.set(author, (authorMap.get(author) || 0) + 1);
    });

    const topAuthors = Array.from(authorMap.entries())
        .map(([author, books]) => ({ author, books }))
        .sort((a, b) => b.books - a.books)
        .slice(0, 5);

    // Reading goal
    const { data: goal } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .single();

    return {
        year,
        totalBooks: yearBooks.length,
        totalPages,
        genreBreakdown,
        monthlyReading,
        topAuthors,
        readingGoalProgress: goal
            ? {
                target: goal.target_books,
                achieved: yearBooks.length,
                percentage: Math.round((yearBooks.length / goal.target_books) * 100),
            }
            : { target: 0, achieved: yearBooks.length, percentage: 0 },
    };
}
