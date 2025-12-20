import { supabase } from './supabase';
import { Book } from './supabase';

export interface Wishlist {
    id: string;
    user_id: string;
    book_id: string;
    priority: 'high' | 'medium' | 'low';
    notes?: string;
    price_alert?: number;
    added_at: string;
}

export async function addToWishlist(
    userId: string,
    bookId: string,
    priority: Wishlist['priority'] = 'medium',
    notes?: string,
    priceAlert?: number
): Promise<Wishlist | null> {
    const { data, error } = await supabase
        .from('wishlist')
        .insert({
            user_id: userId,
            book_id: bookId,
            priority,
            notes,
            price_alert: priceAlert,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function removeFromWishlist(userId: string, bookId: string): Promise<boolean> {
    const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId);

    return !error;
}

export async function getWishlistItems(userId: string): Promise<(Wishlist & { book: Book })[]> {
    const { data } = await supabase
        .from('wishlist')
        .select('*, book:book_id (*)')
        .eq('user_id', userId)
        .order('priority', { ascending: true })
        .order('added_at', { ascending: false });

    return data || [];
}

export async function updateWishlistPriority(
    userId: string,
    bookId: string,
    priority: Wishlist['priority']
): Promise<boolean> {
    const { error } = await supabase
        .from('wishlist')
        .update({ priority })
        .eq('user_id', userId)
        .eq('book_id', bookId);

    return !error;
}

export async function setPriceAlert(
    userId: string,
    bookId: string,
    targetPrice: number
): Promise<boolean> {
    const { error } = await supabase
        .from('wishlist')
        .update({ price_alert: targetPrice })
        .eq('user_id', userId)
        .eq('book_id', bookId);

    return !error;
}

export function sortWishlistByPriority(items: Wishlist[]): Wishlist[] {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function getWishlistStats(items: Wishlist[]) {
    return {
        total: items.length,
        highPriority: items.filter(i => i.priority === 'high').length,
        mediumPriority: items.filter(i => i.priority === 'medium').length,
        lowPriority: items.filter(i => i.priority === 'low').length,
        withPriceAlerts: items.filter(i => i.price_alert).length,
    };
}
