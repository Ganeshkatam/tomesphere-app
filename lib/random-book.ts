import { Book } from './supabase';

export function getRandomBook(books: Book[], selectedGenres: string[] = []): Book | null {
    if (books.length === 0) return null;

    let filteredBooks = books;

    // Filter by genres if specified
    if (selectedGenres.length > 0) {
        filteredBooks = books.filter(book => selectedGenres.includes(book.genre));
    }

    if (filteredBooks.length === 0) return null;

    // Get random index
    const randomIndex = Math.floor(Math.random() * filteredBooks.length);
    return filteredBooks[randomIndex];
}

export function getRandomBooks(books: Book[], count: number, selectedGenres: string[] = []): Book[] {
    if (books.length === 0) return [];

    let filteredBooks = books;

    if (selectedGenres.length > 0) {
        filteredBooks = books.filter(book => selectedGenres.includes(book.genre));
    }

    // Shuffle array
    const shuffled = [...filteredBooks].sort(() => Math.random() - 0.5);

    // Return requested count
    return shuffled.slice(0, Math.min(count, shuffled.length));
}
