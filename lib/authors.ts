export interface Author {
    id: string;
    name: string;
    bio?: string;
    photo_url?: string;
    birth_year?: number;
    nationality?: string;
    website?: string;
    twitter?: string;
    created_at: string;
}

export async function getAuthorFromName(name: string): Promise<Author> {
    // This would normally query a database or API
    // For now, create a basic author object
    return {
        id: `author-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        created_at: new Date().toISOString(),
    };
}

export async function getAuthorBooks(authorName: string, allBooks: any[]): Promise<any[]> {
    return allBooks.filter(book =>
        book.author?.toLowerCase() === authorName.toLowerCase()
    );
}

export function getAuthorStats(books: any[]) {
    if (books.length === 0) {
        return {
            totalBooks: 0,
            avgRating: 0,
            totalReviews: 0,
            genres: [],
        };
    }

    const avgRating = books.reduce((sum, book) => sum + (book.rating || 0), 0) / books.length;
    const genres = Array.from(new Set(books.map(b => b.genre).filter(Boolean)));

    return {
        totalBooks: books.length,
        avgRating: Number(avgRating.toFixed(1)),
        totalReviews: books.length * 10, // Estimate
        genres,
    };
}
