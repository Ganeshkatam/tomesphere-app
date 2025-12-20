import { Book } from './supabase';

export interface Genre {
    name: string;
    description: string;
    subgenres: string[];
    popularAuthors: string[];
    characteristics: string[];
    mood: string[];
}

export const genreDirectory: Record<string, Genre> = {
    fantasy: {
        name: 'Fantasy',
        description: 'Immerse yourself in magical worlds with mythical creatures and epic adventures',
        subgenres: ['High Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Sword & Sorcery'],
        popularAuthors: ['Brandon Sanderson', 'J.R.R. Tolkien', 'Patrick Rothfuss'],
        characteristics: ['Magic systems', 'World-building', 'Epic quests', 'Mythical creatures'],
        mood: ['adventurous', 'curious', 'escapist'],
    },
    scifi: {
        name: 'Science Fiction',
        description: 'Explore future technologies, space exploration, and speculative science',
        subgenres: ['Hard Sci-Fi', 'Space Opera', 'Cyberpunk', 'Dystopian'],
        popularAuthors: ['Isaac Asimov', 'Arthur C. Clarke', 'Philip K. Dick'],
        characteristics: ['Advanced technology', 'Space travel', 'Futuristic societies', 'Scientific concepts'],
        mood: ['curious', 'adventurous', 'thoughtful'],
    },
    mystery: {
        name: 'Mystery & Thriller',
        description: 'Solve puzzles and unravel secrets in suspenseful page-turners',
        subgenres: ['Cozy Mystery', 'Police Procedural', 'Detective Fiction', 'Psychological Thriller'],
        popularAuthors: ['Agatha Christie', 'Arthur Conan Doyle', 'Gillian Flynn'],
        characteristics: ['Suspense', 'Plot twists', 'Investigation', 'Puzzle-solving'],
        mood: ['curious', 'engaged', 'stressed'],
    },
    romance: {
        name: 'Romance',
        description: 'Heartwarming love stories with emotional connections and happy endings',
        subgenres: ['Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Romantic Comedy'],
        popularAuthors: ['Nora Roberts', 'Julia Quinn', 'Sarah J. Maas'],
        characteristics: ['Love stories', 'Emotional depth', 'Relationship focus', 'Happy endings'],
        mood: ['romantic', 'happy', 'emotional'],
    },
};

export function exploreGenre(genreName: string, books: Book[]): {
    genre: Genre;
    recommendedBooks: Book[];
    stats: {
        totalBooks: number;
        averageRating: number;
        popularSeries: string[];
    };
} {
    const genre = genreDirectory[genreName.toLowerCase()] || genreDirectory.fantasy;
    const genreBooks = books.filter(b =>
        b.genre.toLowerCase().includes(genreName.toLowerCase())
    );

    // Get popular series in this genre
    const seriesMap = new Map<string, number>();
    genreBooks.forEach(book => {
        if (book.series) {
            seriesMap.set(book.series, (seriesMap.get(book.series) || 0) + 1);
        }
    });

    const popularSeries = Array.from(seriesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([series]) => series);

    return {
        genre,
        recommendedBooks: genreBooks.slice(0, 12),
        stats: {
            totalBooks: genreBooks.length,
            averageRating: 4.2, // Would calculate from actual ratings
            popularSeries,
        },
    };
}

export function getRelatedGenres(genreName: string): string[] {
    const relationships: Record<string, string[]> = {
        fantasy: ['Science Fiction', 'Adventure', 'Young Adult'],
        scifi: ['Fantasy', 'Thriller', 'Dystopian'],
        mystery: ['Thriller', 'Crime', 'Suspense'],
        romance: ['Contemporary Fiction', 'Historical Fiction', 'Young Adult'],
        horror: ['Thriller', 'Dark Fantasy', 'Mystery'],
    };

    return relationships[genreName.toLowerCase()] || [];
}

export function getGenreTrends(books: Book[]): {
    genre: string;
    count: number;
    percentChange: number;
}[] {
    const genreCount = new Map<string, number>();

    books.forEach(book => {
        genreCount.set(book.genre, (genreCount.get(book.genre) || 0) + 1);
    });

    return Array.from(genreCount.entries())
        .map(([genre, count]) => ({
            genre,
            count,
            percentChange: Math.floor(Math.random() * 40) - 10, // Mock trend data
        }))
        .sort((a, b) => b.count - a.count);
}
