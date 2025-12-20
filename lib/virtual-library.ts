import { Book } from './supabase';

export interface Bookshelf {
    id: string;
    name: string;
    books: Book[];
    position: { row: number; col: number };
    style: 'modern' | 'classic' | 'minimalist';
}

export interface VirtualLibrary {
    shelves: Bookshelf[];
    layout: '3x3' | '4x4' | '5x5';
    theme: 'wood' | 'metal' | 'glass';
}

export function createVirtualLibrary(books: Book[]): VirtualLibrary {
    const genres = Array.from(new Set(books.map(b => b.genre)));
    const shelves: Bookshelf[] = [];

    // Group books by genre into shelves
    genres.forEach((genre, index) => {
        const genreBooks = books.filter(b => b.genre === genre);
        shelves.push({
            id: `shelf-${index}`,
            name: genre,
            books: genreBooks,
            position: { row: Math.floor(index / 3), col: index % 3 },
            style: 'modern',
        });
    });

    return {
        shelves,
        layout: '3x3',
        theme: 'wood',
    };
}

export function sortShelf(books: Book[], sortBy: 'title' | 'author' | 'date'): Book[] {
    return [...books].sort((a, b) => {
        switch (sortBy) {
            case 'title':
                return (a.title || '').localeCompare(b.title || '');
            case 'author':
                return (a.author || '').localeCompare(b.author || '');
            case 'date':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            default:
                return 0;
        }
    });
}

export function visualizeBookSpine(book: Book): {
    color: string;
    height: number;
    thickness: number;
} {
    const colors = [
        '#8b4513', '#cd853f', '#daa520', '#b8860b',
        '#4682b4', '#5f9ea0', '#6495ed', '#7b68ee',
        '#228b22', '#2e8b57', '#3cb371', '#66cdaa',
        '#dc143c', '#b22222', '#cd5c5c', '#f08080',
    ];

    const hashCode = (book.id || '').split('').reduce((acc, char) =>
        acc + char.charCodeAt(0), 0
    );

    return {
        color: colors[hashCode % colors.length],
        height: 200 + ((book.pages || 200) / 10),
        thickness: 20 + ((book.pages || 100) / 50),
    };
}

export const shelfStyles = {
    modern: {
        background: 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%)',
        border: '2px solid #ccc',
        shadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    classic: {
        background: 'linear-gradient(180deg, #8b4513 0%, #654321 100%)',
        border: '2px solid #3e2723',
        shadow: '0 6px 12px rgba(0,0,0,0.3)',
    },
    minimalist: {
        background: '#ffffff',
        border: '1px solid #000',
        shadow: 'none',
    },
};
