export interface BookRecommendation {
    book_id: string;
    score: number;
    reason: string;
}

export async function getPersonalizedRecommendations(
    userId: string,
    allBooks: any[],
    limit: number = 10
): Promise<BookRecommendation[]> {
    // This would use a more sophisticated algorithm in production
    // For now, implement collaborative filtering basics

    const recommendations: BookRecommendation[] = [];

    // Simple content-based filtering
    // 1. Get user's favorite genres from their ratings
    // 2. Find highly-rated books in those genres they haven't read
    // 3. Consider books by authors they like
    // 4. Factor in trending books

    // Mock implementation for now
    allBooks.forEach(book => {
        const score = Math.random() * 100; // Would be actual ML score
        const reasons = [
            'Based on your love of Science Fiction',
            'Fans of your favorite authors also enjoyed this',
            'Trending in your favorite genres',
            'Similar to books you rated 5 stars',
        ];

        recommendations.push({
            book_id: book.id,
            score,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
        });
    });

    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

export function calculateBookSimilarity(book1: any, book2: any): number {
    let score = 0;

    // Same genre: +40 points
    if (book1.genre === book2.genre) score += 40;

    // Same author: +30 points
    if (book1.author === book2.author) score += 30;

    // Similar publication year (+/- 5 years): +10 points  
    const yearDiff = Math.abs((book1.publication_year || 0) - (book2.publication_year || 0));
    if (yearDiff <= 5) score += 10;

    // Similar page count (+/- 100 pages): +10 points
    const pageDiff = Math.abs((book1.pages || 0) - (book2.pages || 0));
    if (pageDiff <= 100) score += 10;

    // Same language: +10 points
    if (book1.language === book2.language) score += 10;

    return score;
}
