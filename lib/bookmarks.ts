export interface BookmarksSystem {
    id: string;
    userId: string;
    bookId: string;
    page?: number;
    chapter?: string;
    note?: string;
    createdAt: string;
}

export class BookmarkManager {
    addBookmark(
        userId: string,
        bookId: string,
        page?: number,
        chapter?: string,
        note?: string
    ): BookmarksSystem {
        const bookmark: BookmarksSystem = {
            id: crypto.randomUUID(),
            userId,
            bookId,
            page,
            chapter,
            note,
            createdAt: new Date().toISOString(),
        };

        this.save(bookmark);
        return bookmark;
    }

    private save(bookmark: BookmarksSystem): void {
        const bookmarks = this.getAll(bookmark.userId);
        bookmarks.push(bookmark);
        localStorage.setItem(`bookmarks-${bookmark.userId}`, JSON.stringify(bookmarks));
    }

    getAll(userId: string): BookmarksSystem[] {
        const stored = localStorage.getItem(`bookmarks-${userId}`);
        return stored ? JSON.parse(stored) : [];
    }

    getByBook(userId: string, bookId: string): BookmarksSystem[] {
        return this.getAll(userId).filter(b => b.bookId === bookId);
    }

    delete(userId: string, bookmarkId: string): boolean {
        const bookmarks = this.getAll(userId).filter(b => b.id !== bookmarkId);
        localStorage.setItem(`bookmarks-${userId}`, JSON.stringify(bookmarks));
        return true;
    }
}

export const bookmarkManager = new BookmarkManager();
