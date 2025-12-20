import { supabase } from './supabase';

export interface AggregatedRating {
    book_id: string;
    average_rating: number;
    total_ratings: number;
    rating_distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export async function getBookRatings(bookId: string): Promise<AggregatedRating | null> {
    const { data: ratings } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('book_id', bookId);

    if (!ratings || ratings.length === 0) return null;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    ratings.forEach(r => {
        distribution[r.rating as keyof typeof distribution]++;
        sum += r.rating;
    });

    return {
        book_id: bookId,
        average_rating: sum / ratings.length,
        total_ratings: ratings.length,
        rating_distribution: distribution,
    };
}

export async function getUserRating(userId: string, bookId: string): Promise<number | null> {
    const { data } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single();

    return data?.rating || null;
}

export async function rateBook(
    userId: string,
    bookId: string,
    rating: number
): Promise<boolean> {
    if (rating < 1 || rating > 5) return false;

    const { error } = await supabase
        .from('book_ratings')
        .upsert({
            user_id: userId,
            book_id: bookId,
            rating,
            rated_at: new Date().toISOString(),
        });

    return !error;
}

export function getRatingPercentages(distribution: AggregatedRating['rating_distribution']) {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    return {
        5: Math.round((distribution[5] / total) * 100),
        4: Math.round((distribution[4] / total) * 100),
        3: Math.round((distribution[3] / total) * 100),
        2: Math.round((distribution[2] / total) * 100),
        1: Math.round((distribution[1] / total) * 100),
    };
}

export function getRatingLabel(average: number): string {
    if (average >= 4.5) return 'Exceptional';
    if (average >= 4.0) return 'Excellent';
    if (average >= 3.5) return 'Very Good';
    if (average >= 3.0) return 'Good';
    if (average >= 2.5) return 'Average';
    if (average >= 2.0) return 'Below Average';
    return 'Poor';
}

export async function getTopRatedBooks(limit: number = 10): Promise<any[]> {
    // This would require a materialized view or aggregation in production
    const { data } = await supabase
        .from('books')
        .select(`
      *,
      ratings:book_ratings(rating)
    `)
        .limit(limit);

    if (!data) return [];

    return data
        .map(book => ({
            ...book,
            average_rating: book.ratings.length > 0
                ? book.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / book.ratings.length
                : 0,
            total_ratings: book.ratings.length,
        }))
        .sort((a, b) => b.average_rating - a.average_rating)
        .filter(book => book.total_ratings >= 5); // Minimum 5 ratings
}
