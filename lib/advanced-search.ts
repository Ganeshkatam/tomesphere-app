import { Book } from './supabase';

export interface SearchFilters {
    query: string;
    genres?: string[];
    authors?: string[];
    yearRange?: { min?: number; max?: number };
    pageRange?: { min?: number; max?: number };
    rating?: { min: number; max: number };
    tags?: string[];
    series?: string;
    featured?: boolean;
    sortBy?: 'relevance' | 'title' | 'author' | 'year' | 'rating' | 'popularity';
    sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
    book: Book;
    score: number;
    matchedFields: string[];
}

export class AdvancedSearch {
    private allBooks: Book[] = [];

    constructor(books: Book[]) {
        this.allBooks = books;
    }

    search(filters: SearchFilters): SearchResult[] {
        let results = this.allBooks.map(book => ({
            book,
            score: 0,
            matchedFields: [] as string[],
        }));

        // Text search
        if (filters.query) {
            results = results.map(result => {
                const query = filters.query.toLowerCase();
                let score = result.score;
                const matched: string[] = [];

                // Title match (highest priority)
                if (result.book.title.toLowerCase().includes(query)) {
                    score += 100;
                    matched.push('title');
                }

                // Author match
                if (result.book.author.toLowerCase().includes(query)) {
                    score += 50;
                    matched.push('author');
                }

                // Description match
                if (result.book.description?.toLowerCase().includes(query)) {
                    score += 25;
                    matched.push('description');
                }

                // Genre match
                if (result.book.genre.toLowerCase().includes(query)) {
                    score += 30;
                    matched.push('genre');
                }

                return { ...result, score, matchedFields: matched };
            }).filter(r => r.score > 0);
        }

        // Genre filter
        if (filters.genres && filters.genres.length > 0) {
            results = results.filter(r =>
                filters.genres!.includes(r.book.genre)
            );
        }

        // Author filter
        if (filters.authors && filters.authors.length > 0) {
            results = results.filter(r =>
                filters.authors!.some(author =>
                    r.book.author.toLowerCase().includes(author.toLowerCase())
                )
            );
        }

        // Year range filter
        if (filters.yearRange) {
            results = results.filter(r => {
                const year = new Date(r.book.release_date || r.book.created_at).getFullYear();
                const min = filters.yearRange?.min || 0;
                const max = filters.yearRange?.max || 9999;
                return year >= min && year <= max;
            });
        }

        // Page range filter
        if (filters.pageRange) {
            results = results.filter(r => {
                const pages = r.book.pages || 0;
                const min = filters.pageRange?.min || 0;
                const max = filters.pageRange?.max || 999999;
                return pages >= min && pages <= max;
            });
        }

        // Series filter
        if (filters.series) {
            results = results.filter(r =>
                r.book.series?.toLowerCase().includes(filters.series!.toLowerCase())
            );
        }

        // Featured filter
        if (filters.featured !== undefined) {
            results = results.filter(r => r.book.is_featured === filters.featured);
        }

        // Sort results
        results = this.sortResults(results, filters.sortBy || 'relevance', filters.sortOrder || 'desc');

        return results;
    }

    private sortResults(
        results: SearchResult[],
        sortBy: SearchFilters['sortBy'],
        order: 'asc' | 'desc'
    ): SearchResult[] {
        const sorted = [...results].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'relevance':
                    comparison = b.score - a.score;
                    break;
                case 'title':
                    comparison = a.book.title.localeCompare(b.book.title);
                    break;
                case 'author':
                    comparison = a.book.author.localeCompare(b.book.author);
                    break;
                case 'year':
                    const yearA = new Date(a.book.release_date || a.book.created_at).getFullYear();
                    const yearB = new Date(b.book.release_date || b.book.created_at).getFullYear();
                    comparison = yearB - yearA;
                    break;
                default:
                    comparison = b.score - a.score;
            }

            return order === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }

    getFacets(results: SearchResult[]): {
        genres: { name: string; count: number }[];
        authors: { name: string; count: number }[];
        years: { year: number; count: number }[];
    } {
        const genreMap = new Map<string, number>();
        const authorMap = new Map<string, number>();
        const yearMap = new Map<number, number>();

        results.forEach(({ book }) => {
            // Count genres
            genreMap.set(book.genre, (genreMap.get(book.genre) || 0) + 1);

            // Count authors
            authorMap.set(book.author, (authorMap.get(book.author) || 0) + 1);

            // Count years
            const year = new Date(book.release_date || book.created_at).getFullYear();
            yearMap.set(year, (yearMap.get(year) || 0) + 1);
        });

        return {
            genres: Array.from(genreMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            authors: Array.from(authorMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20),
            years: Array.from(yearMap.entries())
                .map(([year, count]) => ({ year, count }))
                .sort((a, b) => b.year - a.year),
        };
    }
}
