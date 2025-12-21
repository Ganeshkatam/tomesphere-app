import { supabase } from './supabase';

export interface AnalyticsSnapshot {
    activeUsers: number;
    activeReadings: number;
    signupsToday: number;
    booksViewedToday: number;
    totalBooks: number;
    totalUsers: number;
    newBooksThisWeek: number;
    averageRating: number;
}

export interface UserGrowthData {
    date: string;
    users: number;
    signups: number;
}

export interface GenreDistribution {
    genre: string;
    count: number;
    percentage: number;
}

export interface PopularBook {
    id: string;
    title: string;
    author: string;
    views: number;
    likes: number;
}

/**
 * Get current analytics snapshot
 */
export async function getLiveAnalytics(): Promise<AnalyticsSnapshot> {
    try {
        // Get total users
        const { data: users, count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Get active users (logged in within last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data: activeUsersData, count: activeUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', oneDayAgo.toISOString());

        // Get total books
        const { data: books, count: totalBooks } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true });

        // Get signups today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: signupsData, count: signupsToday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // Get new books this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: newBooks, count: newBooksThisWeek } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString());

        return {
            activeUsers: activeUsers || 0,
            activeReadings: 0, // Pending integration
            signupsToday: signupsToday || 0,
            booksViewedToday: 0, // View tracking not yet implemented
            totalBooks: totalBooks || 0,
            totalUsers: totalUsers || 0,
            newBooksThisWeek: newBooksThisWeek || 0,
            averageRating: 0, // Will calculate when we have ratings
        };
    } catch (error) {
        console.error('Error fetching live analytics:', error);
        throw error;
    }
}

/**
 * Get user growth data for the last N days
 */
export async function getUserGrowthData(days: number = 30): Promise<UserGrowthData[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: profiles } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (!profiles) return [];

        // Group by day
        const groupedByDay: { [key: string]: number } = {};
        profiles.forEach(profile => {
            const date = new Date(profile.created_at).toISOString().split('T')[0];
            groupedByDay[date] = (groupedByDay[date] || 0) + 1;
        });

        // Create array with cumulative counts
        const result: UserGrowthData[] = [];
        let cumulativeUsers = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const signups = groupedByDay[dateStr] || 0;
            cumulativeUsers += signups;

            result.push({
                date: dateStr,
                users: cumulativeUsers,
                signups: signups,
            });
        }

        return result;
    } catch (error) {
        console.error('Error fetching user growth data:', error);
        return [];
    }
}

/**
 * Get genre distribution
 */
export async function getGenreDistribution(): Promise<GenreDistribution[]> {
    try {
        const { data: books } = await supabase
            .from('books')
            .select('genre');

        if (!books) return [];

        // Count by genre
        const genreCounts: { [key: string]: number } = {};
        books.forEach(book => {
            genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        });

        const total = books.length;

        // Convert to array and calculate percentages
        return Object.entries(genreCounts)
            .map(([genre, count]) => ({
                genre,
                count,
                percentage: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error('Error fetching genre distribution:', error);
        return [];
    }
}

/**
 * Get popular books (by featured status for now, enriched with real like counts)
 */
export async function getPopularBooks(limit: number = 10): Promise<PopularBook[]> {
    try {
        const { data: books } = await supabase
            .from('books')
            .select('id, title, author')
            .eq('is_featured', true)
            .limit(limit);

        if (!books) return [];

        const booksWithStats = await Promise.all(books.map(async (book) => {
            const { count } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('book_id', book.id);

            return {
                ...book,
                views: 0, // View tracking not yet implemented
                likes: count || 0,
            };
        }));

        return booksWithStats.sort((a, b) => b.likes - a.likes);
    } catch (error) {
        console.error('Error fetching popular books:', error);
        return [];
    }
}

/**
 * Get reading activity by hour (for heatmap)
 */
export async function getActivityByHour(): Promise<{ hour: number; activity: number }[]> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch sessions started today
        const { data: sessions } = await supabase
            .from('reading_sessions')
            .select('started_at')
            .gte('started_at', today.toISOString());

        // Initialize 24h counters
        const activityByHour = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            activity: 0
        }));

        if (sessions) {
            sessions.forEach(session => {
                const date = new Date(session.started_at);
                const hour = date.getHours(); // Local time hour (0-23)
                if (hour >= 0 && hour < 24) {
                    activityByHour[hour].activity += 1;
                }
            });
        }

        return activityByHour;
    } catch (error) {
        console.error('Error fetching activity by hour:', error);
        // Return zeros on error to prevent UI crash
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            activity: 0,
        }));
    }
}
