import { Book } from './supabase';

export interface SearchSuggestion {
    type: 'book' | 'author' | 'genre' | 'tag';
    text: string;
    data?: any;
}

export class SearchAutocomplete {
    private suggestionCache: Map<string, SearchSuggestion[]> = new Map();

    async getSuggestions(query: string, books: Book[]): Promise<SearchSuggestion[]> {
        if (query.length < 2) return [];

        // Check cache
        const cached = this.suggestionCache.get(query.toLowerCase());
        if (cached) return cached;

        const suggestions: SearchSuggestion[] = [];
        const lowerQuery = query.toLowerCase();

        // Book title suggestions
        books.forEach(book => {
            if (book.title.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'book',
                    text: book.title,
                    data: book,
                });
            }
        });

        // Author suggestions
        const authors = new Set(books.map(b => b.author));
        authors.forEach(author => {
            if (author.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'author',
                    text: author,
                    data: { author },
                });
            }
        });

        // Genre suggestions
        const genres = new Set(books.map(b => b.genre));
        genres.forEach(genre => {
            if (genre.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'genre',
                    text: genre,
                    data: { genre },
                });
            }
        });

        // Limit and cache
        const limited = suggestions.slice(0, 10);
        this.suggestionCache.set(lowerQuery, limited);

        return limited;
    }

    highlightMatch(text: string, query: string): string {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    clearCache(): void {
        this.suggestionCache.clear();
    }
}

export const searchAutocomplete = new SearchAutocomplete();
