import { supabase } from './supabase';

export interface GoodreadsBook {
    title: string;
    author: string;
    isbn?: string;
    rating?: number;
    dateRead?: string;
    shelf: string;
}

export async function parseGoodreadsCSV(csvContent: string): Promise<GoodreadsBook[]> {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const books: GoodreadsBook[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const book: any = {};

        headers.forEach((header, index) => {
            book[header] = values[index];
        });

        books.push({
            title: book['Title'] || '',
            author: book['Author'] || '',
            isbn: book['ISBN13'] || book['ISBN'],
            rating: parseInt(book['My Rating']) || undefined,
            dateRead: book['Date Read'],
            shelf: book['Exclusive Shelf'] || 'to-read',
        });
    }

    return books.filter(b => b.title);
}

export async function importBooksToTomeSphere(
    userId: string,
    goodreadsBooks: GoodreadsBook[]
): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const grBook of goodreadsBooks) {
        // Check if book exists in database
        const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .or(`title.eq.${grBook.title},isbn.eq.${grBook.isbn}`)
            .single();

        let bookId = existingBook?.id;

        // If book doesn't exist, create it
        if (!bookId && grBook.isbn) {
            // Try to fetch from external API
            const bookData = await fetchBookByISBN(grBook.isbn);
            if (bookData) {
                const { data: newBook } = await supabase
                    .from('books')
                    .insert(bookData)
                    .select('id')
                    .single();
                bookId = newBook?.id;
            }
        }

        if (bookId) {
            // Add to user's library
            const status = grBook.shelf === 'read' ? 'finished' :
                grBook.shelf === 'currently-reading' ? 'currently_reading' :
                    'want_to_read';

            await supabase.from('user_books').insert({
                user_id: userId,
                book_id: bookId,
                status,
                rating: grBook.rating,
                finished_at: grBook.dateRead,
            });

            imported++;
        } else {
            skipped++;
        }
    }

    return { imported, skipped };
}

async function fetchBookByISBN(isbn: string): Promise<any | null> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            return {
                title: book.title,
                author: book.authors?.[0],
                description: book.description,
                cover_url: book.imageLinks?.thumbnail,
                isbn: isbn,
                pages: book.pageCount,
                publication_year: parseInt(book.publishedDate?.substring(0, 4) || '0'),
                publisher: book.publisher,
                language: book.language,
            };
        }
    } catch (error) {
        console.error('Error fetching book:', error);
    }
    return null;
}
