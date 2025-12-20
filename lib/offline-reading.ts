export interface OfflineBook {
    bookId: string;
    title: string;
    author: string;
    content: string; // Cached book content
    coverUrl: string;
    downloadedAt: string;
    lastAccessed: string;
    size: number; // in bytes
}

export class OfflineReadingManager {
    private readonly CACHE_NAME = 'tomesphere-offline-books';
    private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB

    async downloadBook(bookId: string, bookData: any): Promise<boolean> {
        try {
            // Check if we have space
            const currentSize = await this.getCacheSize();
            const bookSize = new Blob([JSON.stringify(bookData)]).size;

            if (currentSize + bookSize > this.MAX_CACHE_SIZE) {
                await this.clearOldestBooks();
            }

            // Store in IndexedDB
            const db = await this.openDB();
            const tx = db.transaction('books', 'readwrite');
            const store = tx.objectStore('books');

            const offlineBook: OfflineBook = {
                bookId,
                title: bookData.title,
                author: bookData.author,
                content: bookData.content || '',
                coverUrl: bookData.cover_url,
                downloadedAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString(),
                size: bookSize,
            };

            await store.put(offlineBook);
            await tx.done;

            return true;
        } catch (error) {
            console.error('Failed to download book:', error);
            return false;
        }
    }

    async getOfflineBook(bookId: string): Promise<OfflineBook | null> {
        try {
            const db = await this.openDB();
            const book = await db.get('books', bookId);

            if (book) {
                // Update last accessed
                book.lastAccessed = new Date().toISOString();
                await db.put('books', book);
                return book;
            }

            return null;
        } catch (error) {
            console.error('Failed to get offline book:', error);
            return null;
        }
    }

    async isBookAvailableOffline(bookId: string): Promise<boolean> {
        const book = await this.getOfflineBook(bookId);
        return book !== null;
    }

    async getAllOfflineBooks(): Promise<OfflineBook[]> {
        try {
            const db = await this.openDB();
            return await db.getAll('books');
        } catch (error) {
            console.error('Failed to get offline books:', error);
            return [];
        }
    }

    async deleteOfflineBook(bookId: string): Promise<boolean> {
        try {
            const db = await this.openDB();
            await db.delete('books', bookId);
            return true;
        } catch (error) {
            console.error('Failed to delete offline book:', error);
            return false;
        }
    }

    async getCacheSize(): Promise<number> {
        const books = await this.getAllOfflineBooks();
        return books.reduce((total, book) => total + book.size, 0);
    }

    async clearOldestBooks(): Promise<void> {
        const books = await this.getAllOfflineBooks();
        const sorted = books.sort((a, b) =>
            new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
        );

        // Remove oldest 25% of books
        const toRemove = Math.ceil(sorted.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            await this.deleteOfflineBook(sorted[i].bookId);
        }
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private async openDB(): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TomeSphereOffline', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('books')) {
                    db.createObjectStore('books', { keyPath: 'bookId' });
                }
            };
        });
    }
}

export const offlineReading = new OfflineReadingManager();
