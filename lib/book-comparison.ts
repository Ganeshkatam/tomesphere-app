import { Book } from './supabase';

export interface BookComparison {
    books: Book[];
    comparison: {
        title: string[];
        author: string[];
        genre: string[];
        pages: number[];
        description: string[];
        releaseDate: string[];
    };
    similarities: string[];
    differences: string[];
    recommendation: string;
}

export function compareBooks(books: Book[]): BookComparison {
    const comparison = {
        title: books.map(b => b.title),
        author: books.map(b => b.author),
        genre: books.map(b => b.genre),
        pages: books.map(b => b.pages || 0),
        description: books.map(b => b.description || ''),
        releaseDate: books.map(b => b.release_date || ''),
    };

    const similarities: string[] = [];
    const differences: string[] = [];

    // Check for same author
    const uniqueAuthors = new Set(comparison.author);
    if (uniqueAuthors.size === 1) {
        similarities.push(`All by ${comparison.author[0]}`);
    } else {
        differences.push(`Different authors: ${Array.from(uniqueAuthors).join(', ')}`);
    }

    // Check for same genre
    const uniqueGenres = new Set(comparison.genre);
    if (uniqueGenres.size === 1) {
        similarities.push(`All ${comparison.genre[0]} genre`);
    } else {
        differences.push(`Mixed genres: ${Array.from(uniqueGenres).join(', ')}`);
    }

    // Page count comparison
    const avgPages = comparison.pages.reduce((a, b) => a + b, 0) / comparison.pages.length;
    const pageVariance = Math.max(...comparison.pages) - Math.min(...comparison.pages);

    if (pageVariance < 100) {
        similarities.push(`Similar length (~${Math.round(avgPages)} pages)`);
    } else {
        differences.push(`Length varies from ${Math.min(...comparison.pages)} to ${Math.max(...comparison.pages)} pages`);
    }

    // Generate recommendation
    let recommendation = 'Based on comparison: ';
    if (similarities.length > differences.length) {
        recommendation += 'These books are very similar. Pick based on specific plot interests.';
    } else {
        recommendation += 'These books offer different experiences. Choose based on mood.';
    }

    return {
        books,
        comparison,
        similarities,
        differences,
        recommendation,
    };
}

export function getSimilarityScore(book1: Book, book2: Book): number {
    let score = 0;

    if (book1.author === book2.author) score += 40;
    if (book1.genre === book2.genre) score += 30;
    if (book1.series && book1.series === book2.series) score += 50;

    const pageDiff = Math.abs((book1.pages || 0) - (book2.pages || 0));
    if (pageDiff < 100) score += 10;

    return score;
}

export function rankBooksByPreferences(
    books: Book[],
    preferences: {
        preferredGenres?: string[];
        preferredAuthors?: string[];
        minPages?: number;
        maxPages?: number;
    }
): Book[] {
    return books
        .map(book => ({
            book,
            score: calculatePreferenceScore(book, preferences),
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.book);
}

function calculatePreferenceScore(
    book: Book,
    preferences: {
        preferredGenres?: string[];
        preferredAuthors?: string[];
        minPages?: number;
        maxPages?: number;
    }
): number {
    let score = 0;

    if (preferences.preferredGenres?.includes(book.genre)) score += 50;
    if (preferences.preferredAuthors?.includes(book.author)) score += 40;

    const pages = book.pages || 0;
    if (preferences.minPages && pages >= preferences.minPages) score += 10;
    if (preferences.maxPages && pages <= preferences.maxPages) score += 10;

    return score;
}
