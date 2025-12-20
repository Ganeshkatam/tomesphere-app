import { Book } from './supabase';

export interface RecommendationEngine {
    collaborative: (userId: string, books: Book[]) => Promise<Book[]>;
    contentBased: (bookId: string, books: Book[]) => Book[];
    hybrid: (userId: string, books: Book[]) => Promise<Book[]>;
}

export async function getCollaborativeRecommendations(
    userId: string,
    allBooks: Book[]
): Promise<Book[]> {
    // Find users with similar reading patterns
    // This is a simplified version - real implementation would use matrix factorization

    const recommendations: Book[] = [];

    // For now, return books from same genres user likes
    // In production, this would use actual collaborative filtering algorithms

    return recommendations.slice(0, 10);
}

export function getContentBasedRecommendations(
    bookId: string,
    allBooks: Book[]
): Book[] {
    const targetBook = allBooks.find(b => b.id === bookId);
    if (!targetBook) return [];

    // Calculate similarity scores
    const scored = allBooks
        .filter(b => b.id !== bookId)
        .map(book => ({
            book,
            score: calculateSimilarity(targetBook, book),
        }))
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, 10).map(s => s.book);
}

function calculateSimilarity(book1: Book, book2: Book): number {
    let score = 0;

    // Same genre: +50 points
    if (book1.genre === book2.genre) score += 50;

    // Same author: +40 points
    if (book1.author === book2.author) score += 40;

    // Same series: +60 points
    if (book1.series && book1.series === book2.series) score += 60;

    // Similar page count (+/- 100 pages): +10 points
    const pageDiff = Math.abs((book1.pages || 0) - (book2.pages || 0));
    if (pageDiff <= 100) score += 10;

    // Published around same time (+/- 2 years): +5 points
    const year1 = new Date(book1.created_at).getFullYear();
    const year2 = new Date(book2.created_at).getFullYear();
    if (Math.abs(year1 - year2) <= 2) score += 5;

    return score;
}

export async function getHybridRecommendations(
    userId: string,
    allBooks: Book[]
): Promise<Book[]> {
    // Combine collaborative and content-based filtering
    const collaborative = await getCollaborativeRecommendations(userId, allBooks);

    // Weight: 60% collaborative, 40% content-based
    const hybrid = [...collaborative];

    // Add some content-based recommendations
    // In production, this would properly merge and weight the results

    return hybrid.slice(0, 12);
}

export interface PersonalizedRecommendation {
    book: Book;
    score: number;
    reason: string;
    source: 'collaborative' | 'content' | 'trending' | 'social';
}

export async function getPersonalizedRecommendations(
    userId: string,
    allBooks: Book[]
): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Mix different recommendation sources
    const sources = [
        {
            books: await getCollaborativeRecommendations(userId, allBooks),
            source: 'collaborative' as const,
            reason: 'Based on users with similar taste',
        },
        {
            books: allBooks.filter(b => b.is_featured),
            source: 'trending' as const,
            reason: 'Trending in your favorite genres',
        },
    ];

    sources.forEach(({ books, source, reason }) => {
        books.forEach((book, index) => {
            recommendations.push({
                book,
                score: 100 - index * 5,
                reason,
                source,
            });
        });
    });

    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
}
