import { Book } from './supabase';

const MAX_HISTORY = 20;
const STORAGE_KEY = 'tomesphere_recent_views';

export interface ViewHistoryItem {
    book: Book;
    viewedAt: number;
}

export function addToViewHistory(book: Book): void {
    if (typeof window === 'undefined') return;

    const history = getViewHistory();

    // Remove if already exists
    const filtered = history.filter(item => item.book.id !== book.id);

    // Add to front
    const updated = [
        { book, viewedAt: Date.now() },
        ...filtered
    ].slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getViewHistory(): ViewHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function clearViewHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
