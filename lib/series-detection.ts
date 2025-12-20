import { Book } from './supabase';

export interface SeriesInfo {
    name: string;
    order: number;
    totalBooks?: number;
}

export function detectSeries(book: Book): SeriesInfo | null {
    const title = book.title || '';

    // Common series patterns
    const patterns = [
        // "Book Title (Series Name #1)"
        /\(([^)]+)\s+#?(\d+)\)/,
        // "Book Title: Series Name, Book 1"
        /:\s*([^,]+),\s*Book\s+(\d+)/i,
        // "Series Name #1: Book Title"
        /^([^#]+)\s+#(\d+):/,
        // "Book 1 in Series Name"
        /Book\s+(\d+)\s+in\s+(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            return {
                name: match[1].trim(),
                order: parseInt(match[2]),
            };
        }
    }

    // Check if book has series metadata
    if (book.series) {
        return {
            name: book.series,
            order: book.series_order || 1,
        };
    }

    return null;
}

export function groupBooksBySeries(books: Book[]): Map<string, Book[]> {
    const seriesMap = new Map<string, Book[]>();

    books.forEach(book => {
        const seriesInfo = detectSeries(book);
        if (seriesInfo) {
            const existing = seriesMap.get(seriesInfo.name) || [];
            seriesMap.set(seriesInfo.name, [...existing, book]);
        }
    });

    // Sort books within each series by order
    seriesMap.forEach((books, seriesName) => {
        books.sort((a, b) => {
            const aInfo = detectSeries(a);
            const bInfo = detectSeries(b);
            return (aInfo?.order || 0) - (bInfo?.order || 0);
        });
    });

    return seriesMap;
}

export function getNextInSeries(book: Book, allBooks: Book[]): Book | null {
    const seriesInfo = detectSeries(book);
    if (!seriesInfo) return null;

    const nextOrder = seriesInfo.order + 1;

    return allBooks.find(b => {
        const bInfo = detectSeries(b);
        return bInfo &&
            bInfo.name === seriesInfo.name &&
            bInfo.order === nextOrder;
    }) || null;
}

export function getSeriesProgress(book: Book, allBooks: Book[]): { current: number; total: number } {
    const seriesInfo = detectSeries(book);
    if (!seriesInfo) return { current: 0, total: 0 };

    const seriesBooks = allBooks.filter(b => {
        const bInfo = detectSeries(b);
        return bInfo && bInfo.name === seriesInfo.name;
    });

    return {
        current: seriesInfo.order,
        total: seriesBooks.length,
    };
}
