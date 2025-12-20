import { supabase, Book } from './supabase';

export interface Quote {
    id: string;
    user_id: string;
    book_id: string;
    text: string;
    page_number?: number;
    created_at: string;
}

export async function saveQuote(
    userId: string,
    bookId: string,
    text: string,
    pageNumber?: number
): Promise<Quote | null> {
    const { data, error } = await supabase
        .from('quotes')
        .insert({
            user_id: userId,
            book_id: bookId,
            text: text.trim(),
            page_number: pageNumber,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving quote:', error);
        return null;
    }

    return data;
}

export async function getUserQuotes(userId: string): Promise<Quote[]> {
    const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return data || [];
}

export async function getBookQuotes(bookId: string, userId?: string): Promise<Quote[]> {
    let query = supabase
        .from('quotes')
        .select('*')
        .eq('book_id', bookId);

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    return data || [];
}

export async function deleteQuote(quoteId: string): Promise<boolean> {
    const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

    return !error;
}

export function generateQuoteImage(quote: string, bookTitle: string, author: string): string {
    // This would integrate with an image generation service
    // For now, return a data URL or placeholder
    return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grad)"/>
      <text x="400" y="250" font-size="32" fill="white" text-anchor="middle" font-family="serif">
        "${quote.length > 150 ? quote.substring(0, 150) + '...' : quote}"
      </text>
      <text x="400" y="400" font-size="20" fill="rgba(255,255,255,0.8)" text-anchor="middle">
        — ${bookTitle}
      </text>
      <text x="400" y="440" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="middle">
        by ${author}
      </text>
    </svg>
  `)}`;
}
